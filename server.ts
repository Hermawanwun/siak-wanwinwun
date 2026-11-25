import crypto from 'crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { hashPassword, loadDatabase, sanitizeUser, saveDatabase } from './src/server/db.ts';
import type { SafeUser, StatsSummary, UserRole, Warga } from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const TOKEN_SECRET = process.env.SESSION_SECRET || 'siak-kelurahan-filament-secret-2026';

interface AuthedRequest extends Request {
  authUser?: SafeUser;
}

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { uid?: string };
    return parsed.uid ?? null;
  } catch {
    return null;
  }
}

function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah kedaluwarsa.' });
    return;
  }
  const db = loadDatabase();
  const found = db.users.find((u) => u.id === userId && u.active);
  if (!found) {
    res.status(401).json({ error: 'Akun pengguna tidak aktif atau tidak ditemukan.' });
    return;
  }
  req.authUser = sanitizeUser(found, db);
  next();
}

function requireRole(roles: UserRole[], message: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: message });
      return;
    }
    next();
  };
}

function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Ensure DB exists on startup
  loadDatabase();

  // --- AUTH ROUTES ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }
    const db = loadDatabase();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !user.active || user.password_hash !== hashPassword(password)) {
      res.status(401).json({ error: 'Email atau kata sandi salah.' });
      return;
    }
    const token = signToken(user.id);
    res.json({ token, user: sanitizeUser(user, db) });
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthedRequest, res: Response) => {
    res.json({ user: req.authUser });
  });

  // Public demo accounts list (email + role only, no secrets) for quick role-testing on login page
  app.get('/api/auth/demo-accounts', (_req: Request, res: Response) => {
    const db = loadDatabase();
    const accounts = db.users
      .filter((u) => u.active)
      .map((u) => sanitizeUser(u, db));
    res.json({ accounts });
  });

  // --- STATS ROUTE (Role-Scoped) ---
  app.get('/api/stats', authMiddleware, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();
    const selectedRwId = typeof req.query.rw_id === 'string' ? req.query.rw_id : undefined;
    const selectedRtId = typeof req.query.rt_id === 'string' ? req.query.rt_id : undefined;

    let scopedWargas = db.wargas;
    let scopedRws = db.rws;
    let scopedRts = db.rts;
    let scopeLabel = 'Seluruh Kelurahan Sukamaju';

    if (user.role === 'RW') {
      const rw = db.rws.find((r) => r.id === user.rw_id);
      scopedRws = rw ? [rw] : [];
      scopedRts = db.rts.filter((rt) => rt.rw_id === user.rw_id);
      const targetRtId =
        selectedRtId && scopedRts.some((rt) => rt.id === selectedRtId)
          ? selectedRtId
          : scopedRts[0]?.id;
      const targetRt = scopedRts.find((rt) => rt.id === targetRtId);
      scopedWargas = targetRtId ? db.wargas.filter((w) => w.rt_id === targetRtId) : [];
      scopeLabel = targetRt
        ? `RW ${rw?.nomor_rw ?? '-'} · Data 1 RT (RT ${targetRt.nomor_rt})`
        : `RW ${rw?.nomor_rw ?? '-'}`;
    } else if (user.role === 'LURAH') {
      if (selectedRwId && selectedRwId !== 'all') {
        const rw = db.rws.find((r) => r.id === selectedRwId);
        scopedWargas = db.wargas.filter((w) => w.rw_id === selectedRwId);
        scopeLabel = rw ? `Monitoring Kelurahan · RW ${rw.nomor_rw}` : 'Kelurahan Sukamaju';
      } else {
        scopeLabel = 'Monitoring Kelurahan Sukamaju (Per RW)';
      }
    } else if (user.role === 'RT') {
      const rt = db.rts.find((r) => r.id === user.rt_id);
      const rw = db.rws.find((r) => r.id === user.rw_id);
      scopeLabel = `Akses Penuh RT ${rt?.nomor_rt ?? ''} / RW ${rw?.nomor_rw ?? ''} (Seluruh Data Warga)`;
    }

    const uniqueKks = new Set(scopedWargas.map((w) => w.no_kk));

    const perRw = scopedRws.map((rw) => {
      const wInRw = db.wargas.filter((w) => w.rw_id === rw.id);
      const kkSet = new Set(wInRw.map((w) => w.no_kk));
      const rtsInRw = db.rts.filter((rt) => rt.rw_id === rw.id);
      return {
        rw_id: rw.id,
        nomor_rw: rw.nomor_rw,
        ketua_rw: rw.ketua_rw,
        total_warga: wInRw.length,
        total_kk: kkSet.size,
        total_rt: rtsInRw.length,
      };
    });

    const perRt = scopedRts.map((rt) => {
      const rw = db.rws.find((r) => r.id === rt.rw_id);
      const wInRt = db.wargas.filter((w) => w.rt_id === rt.id);
      const kkSet = new Set(wInRt.map((w) => w.no_kk));
      return {
        rt_id: rt.id,
        rw_id: rt.rw_id,
        nomor_rt: rt.nomor_rt,
        nomor_rw: rw?.nomor_rw ?? '-',
        ketua_rt: rt.ketua_rt,
        total_warga: wInRt.length,
        total_kk: kkSet.size,
      };
    });

    const summary: StatsSummary = {
      scope_label: scopeLabel,
      total_warga: scopedWargas.length,
      total_kk: uniqueKks.size,
      laki_laki: scopedWargas.filter((w) => w.jenis_kelamin === 'Laki-laki').length,
      perempuan: scopedWargas.filter((w) => w.jenis_kelamin === 'Perempuan').length,
      warga_tetap: scopedWargas.filter((w) => w.status_kependudukan === 'Tetap').length,
      warga_pendatang: scopedWargas.filter((w) => w.status_kependudukan === 'Pendatang').length,
      warga_pindah: scopedWargas.filter((w) => w.status_kependudukan === 'Pindah').length,
      warga_meninggal: scopedWargas.filter((w) => w.status_kependudukan === 'Meninggal').length,
      total_rw: scopedRws.length,
      total_rt: scopedRts.length,
      per_rw: perRw,
      per_rt: perRt,
    };

    res.json({ stats: summary });
  });

  // --- WARGA ROUTES (Primary Key: NIK) ---
  app.get('/api/warga', authMiddleware, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const rwIdParam = typeof req.query.rw_id === 'string' ? req.query.rw_id : '';
    const rtIdParam = typeof req.query.rt_id === 'string' ? req.query.rt_id : '';
    const statusParam = typeof req.query.status === 'string' ? req.query.status : '';

    let items = db.wargas;

    if (user.role === 'RW') {
      // STRICT RULE: RW MELIHAT DATA 1 RT (within their assigned RW only)
      const rtsInMyRw = db.rts.filter((rt) => rt.rw_id === user.rw_id);
      if (rtIdParam === 'all') {
        res.status(403).json({
          error: 'Role RW hanya diizinkan melihat data 1 RT dalam satu waktu (tidak dapat melihat gabungan seluruh RT).',
        });
        return;
      }
      const targetRtId = rtIdParam || rtsInMyRw[0]?.id;
      const validRt = rtsInMyRw.find((rt) => rt.id === targetRtId);
      if (!validRt) {
        res.status(403).json({
          error: 'Anda tidak memiliki akses ke RT di luar wilayah RW Anda.',
        });
        return;
      }
      items = items.filter((w) => w.rt_id === validRt.id && w.rw_id === user.rw_id);
    } else if (user.role === 'LURAH') {
      // STRICT RULE: LURAH BISA MELIHAT DATA RW (filtered per RW, read-only)
      if (rwIdParam && rwIdParam !== 'all') {
        items = items.filter((w) => w.rw_id === rwIdParam);
      }
    } else {
      // ADMIN & RT: full read access, optional filters
      if (rwIdParam && rwIdParam !== 'all') {
        items = items.filter((w) => w.rw_id === rwIdParam);
      }
      if (rtIdParam && rtIdParam !== 'all') {
        items = items.filter((w) => w.rt_id === rtIdParam);
      }
    }

    if (statusParam && statusParam !== 'all') {
      items = items.filter((w) => w.status_kependudukan === statusParam);
    }

    if (search) {
      items = items.filter(
        (w) =>
          w.nik.includes(search) ||
          w.no_kk.includes(search) ||
          w.nama_lengkap.toLowerCase().includes(search) ||
          w.alamat.toLowerCase().includes(search)
      );
    }

    res.json({ wargas: items });
  });

  app.post(
    '/api/warga',
    authMiddleware,
    requireRole(
      ['ADMIN', 'RT'],
      'Akses ditolak. Hanya ADMIN dan RT yang diperbolehkan menambah data warga.'
    ),
    (req: AuthedRequest, res: Response) => {
      const payload = req.body as Partial<Warga>;
      if (!payload.nik || !isValidNik(payload.nik)) {
        res.status(400).json({ error: 'NIK (Primary Key) wajib tepat 16 digit angka.' });
        return;
      }
      if (!payload.no_kk || !isValidNik(payload.no_kk)) {
        res.status(400).json({ error: 'Nomor KK wajib tepat 16 digit angka.' });
        return;
      }
      if (!payload.nama_lengkap?.trim() || !payload.rt_id || !payload.rw_id) {
        res.status(400).json({ error: 'Nama lengkap, RW, dan RT wajib diisi.' });
        return;
      }

      const db = loadDatabase();
      const duplicate = db.wargas.find((w) => w.nik === payload.nik);
      if (duplicate) {
        res.status(409).json({
          error: `Primary Key NIK ${payload.nik} sudah terdaftar atas nama ${duplicate.nama_lengkap}.`,
        });
        return;
      }

      const rtExists = db.rts.find((rt) => rt.id === payload.rt_id && rt.rw_id === payload.rw_id);
      if (!rtExists) {
        res.status(400).json({ error: 'Kombinasi RW dan RT tidak valid.' });
        return;
      }

      const now = new Date().toISOString();
      const newWarga: Warga = {
        nik: payload.nik,
        no_kk: payload.no_kk,
        nama_lengkap: payload.nama_lengkap.trim(),
        tempat_lahir: payload.tempat_lahir?.trim() || '-',
        tanggal_lahir: payload.tanggal_lahir || '1990-01-01',
        jenis_kelamin: payload.jenis_kelamin || 'Laki-laki',
        agama: payload.agama || 'Islam',
        status_perkawinan: payload.status_perkawinan || 'Belum Kawin',
        pekerjaan: payload.pekerjaan?.trim() || '-',
        pendidikan_terakhir: payload.pendidikan_terakhir || 'SMA/SMK',
        golongan_darah: payload.golongan_darah || '-',
        alamat: payload.alamat?.trim() || '-',
        rt_id: payload.rt_id,
        rw_id: payload.rw_id,
        status_kependudukan: payload.status_kependudukan || 'Tetap',
        hubungan_keluarga: payload.hubungan_keluarga || 'Kepala Keluarga',
        created_by: req.authUser!.id,
        created_at: now,
        updated_at: now,
      };

      db.wargas.unshift(newWarga);
      db.audits.unshift({
        id: `aud-${Date.now()}`,
        actor_id: req.authUser!.id,
        actor_name: req.authUser!.name,
        actor_role: req.authUser!.role,
        action: 'CREATE',
        target_type: 'WARGA',
        target_id: newWarga.nik,
        summary: `Menambahkan warga ${newWarga.nama_lengkap} (NIK ${newWarga.nik})`,
        timestamp: now,
      });
      saveDatabase(db);
      res.status(201).json({ warga: newWarga });
    }
  );

  app.put(
    '/api/warga/:nik',
    authMiddleware,
    requireRole(
      ['ADMIN', 'RT'],
      'Akses ditolak. Hanya ADMIN dan RT yang diperbolehkan mengubah data warga.'
    ),
    (req: AuthedRequest, res: Response) => {
      const targetNik = req.params.nik;
      const db = loadDatabase();
      const idx = db.wargas.findIndex((w) => w.nik === targetNik);
      if (idx === -1) {
        res.status(404).json({ error: `Data warga dengan NIK ${targetNik} tidak ditemukan.` });
        return;
      }

      const payload = req.body as Partial<Warga>;
      if (payload.nik && payload.nik !== targetNik) {
        res.status(400).json({ error: 'Primary Key NIK tidak dapat diubah secara langsung.' });
        return;
      }
      if (payload.no_kk && !isValidNik(payload.no_kk)) {
        res.status(400).json({ error: 'Nomor KK wajib tepat 16 digit angka.' });
        return;
      }

      const existing = db.wargas[idx];
      const nextRtId = payload.rt_id ?? existing.rt_id;
      const nextRwId = payload.rw_id ?? existing.rw_id;
      const rtExists = db.rts.find((rt) => rt.id === nextRtId && rt.rw_id === nextRwId);
      if (!rtExists) {
        res.status(400).json({ error: 'Kombinasi RW dan RT tidak valid.' });
        return;
      }

      const now = new Date().toISOString();
      const updated: Warga = {
        ...existing,
        ...payload,
        nik: existing.nik,
        created_by: existing.created_by,
        created_at: existing.created_at,
        updated_at: now,
      };
      db.wargas[idx] = updated;
      db.audits.unshift({
        id: `aud-${Date.now()}`,
        actor_id: req.authUser!.id,
        actor_name: req.authUser!.name,
        actor_role: req.authUser!.role,
        action: 'UPDATE',
        target_type: 'WARGA',
        target_id: updated.nik,
        summary: `Memperbarui data warga ${updated.nama_lengkap} (NIK ${updated.nik})`,
        timestamp: now,
      });
      saveDatabase(db);
      res.json({ warga: updated });
    }
  );

  app.delete(
    '/api/warga/:nik',
    authMiddleware,
    requireRole(
      ['ADMIN', 'RT'],
      'Akses ditolak. Hanya ADMIN dan RT yang diperbolehkan menghapus data warga.'
    ),
    (req: AuthedRequest, res: Response) => {
      const targetNik = req.params.nik;
      const db = loadDatabase();
      const existing = db.wargas.find((w) => w.nik === targetNik);
      if (!existing) {
        res.status(404).json({ error: `Data warga dengan NIK ${targetNik} tidak ditemukan.` });
        return;
      }
      db.wargas = db.wargas.filter((w) => w.nik !== targetNik);
      db.audits.unshift({
        id: `aud-${Date.now()}`,
        actor_id: req.authUser!.id,
        actor_name: req.authUser!.name,
        actor_role: req.authUser!.role,
        action: 'DELETE',
        target_type: 'WARGA',
        target_id: targetNik,
        summary: `Menghapus data warga ${existing.nama_lengkap} (NIK ${targetNik})`,
        timestamp: new Date().toISOString(),
      });
      saveDatabase(db);
      res.json({ deleted: targetNik });
    }
  );

  // --- WILAYAH (RW & RT) ROUTES ---
  app.get('/api/wilayah', authMiddleware, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();

    let rws = db.rws;
    let rts = db.rts;

    if (user.role === 'RW') {
      rws = db.rws.filter((r) => r.id === user.rw_id);
      rts = db.rts.filter((rt) => rt.rw_id === user.rw_id);
    }

    const rtsWithCounts = rts.map((rt) => ({
      ...rt,
      nomor_rw: db.rws.find((r) => r.id === rt.rw_id)?.nomor_rw ?? '-',
      total_warga: db.wargas.filter((w) => w.rt_id === rt.id).length,
    }));

    const rwsWithCounts = rws.map((rw) => ({
      ...rw,
      total_rt: db.rts.filter((rt) => rt.rw_id === rw.id).length,
      total_warga: db.wargas.filter((w) => w.rw_id === rw.id).length,
    }));

    res.json({ rws: rwsWithCounts, rts: rtsWithCounts });
  });

  app.post(
    '/api/wilayah/rw',
    authMiddleware,
    requireRole(['ADMIN'], 'Hanya ADMIN yang dapat menambah data RW.'),
    (req: AuthedRequest, res: Response) => {
      const { nomor_rw, ketua_rw, telepon, kelurahan } = req.body as {
        nomor_rw?: string;
        ketua_rw?: string;
        telepon?: string;
        kelurahan?: string;
      };
      if (!nomor_rw?.trim() || !ketua_rw?.trim()) {
        res.status(400).json({ error: 'Nomor RW dan nama Ketua RW wajib diisi.' });
        return;
      }
      const db = loadDatabase();
      const padded = nomor_rw.trim().padStart(3, '0');
      if (db.rws.some((r) => r.nomor_rw === padded)) {
        res.status(409).json({ error: `RW ${padded} sudah terdaftar.` });
        return;
      }
      const newRw = {
        id: `rw-${padded}-${Date.now()}`,
        nomor_rw: padded,
        ketua_rw: ketua_rw.trim(),
        telepon: telepon?.trim() || '-',
        kelurahan: kelurahan?.trim() || 'Kelurahan Sukamaju',
        created_at: new Date().toISOString(),
      };
      db.rws.push(newRw);
      saveDatabase(db);
      res.status(201).json({ rw: newRw });
    }
  );

  app.post(
    '/api/wilayah/rt',
    authMiddleware,
    requireRole(['ADMIN'], 'Hanya ADMIN yang dapat menambah data RT.'),
    (req: AuthedRequest, res: Response) => {
      const { rw_id, nomor_rt, ketua_rt, telepon } = req.body as {
        rw_id?: string;
        nomor_rt?: string;
        ketua_rt?: string;
        telepon?: string;
      };
      if (!rw_id || !nomor_rt?.trim() || !ketua_rt?.trim()) {
        res.status(400).json({ error: 'RW induk, Nomor RT, dan nama Ketua RT wajib diisi.' });
        return;
      }
      const db = loadDatabase();
      if (!db.rws.some((r) => r.id === rw_id)) {
        res.status(400).json({ error: 'RW induk tidak ditemukan.' });
        return;
      }
      const padded = nomor_rt.trim().padStart(3, '0');
      if (db.rts.some((rt) => rt.rw_id === rw_id && rt.nomor_rt === padded)) {
        res.status(409).json({ error: `RT ${padded} pada RW tersebut sudah terdaftar.` });
        return;
      }
      const newRt = {
        id: `rt-${padded}-${Date.now()}`,
        rw_id,
        nomor_rt: padded,
        ketua_rt: ketua_rt.trim(),
        telepon: telepon?.trim() || '-',
        created_at: new Date().toISOString(),
      };
      db.rts.push(newRt);
      saveDatabase(db);
      res.status(201).json({ rt: newRt });
    }
  );

  // --- USERS & ROLES ROUTES (ADMIN ONLY) ---
  app.get(
    '/api/users',
    authMiddleware,
    requireRole(['ADMIN'], 'Hanya ADMIN yang dapat mengelola akun pengguna dan role.'),
    (_req: AuthedRequest, res: Response) => {
      const db = loadDatabase();
      res.json({ users: db.users.map((u) => sanitizeUser(u, db)) });
    }
  );

  app.post(
    '/api/users',
    authMiddleware,
    requireRole(['ADMIN'], 'Hanya ADMIN yang dapat menambah akun pengguna.'),
    (req: AuthedRequest, res: Response) => {
      const { name, email, password, role, rw_id, rt_id } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: UserRole;
        rw_id?: string | null;
        rt_id?: string | null;
      };
      if (!name?.trim() || !email?.trim() || !password || !role) {
        res.status(400).json({ error: 'Nama, email, kata sandi, dan role wajib diisi.' });
        return;
      }
      if (role === 'RW' && !rw_id) {
        res.status(400).json({ error: 'Pengguna dengan role RW wajib ditugaskan ke sebuah RW.' });
        return;
      }
      if (role === 'RT' && (!rw_id || !rt_id)) {
        res.status(400).json({ error: 'Pengguna dengan role RT wajib ditugaskan ke RW dan RT.' });
        return;
      }

      const db = loadDatabase();
      if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        res.status(409).json({ error: 'Email sudah terdaftar.' });
        return;
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: hashPassword(password),
        role,
        rw_id: role === 'ADMIN' || role === 'LURAH' ? null : rw_id ?? null,
        rt_id: role === 'RT' ? rt_id ?? null : null,
        active: true,
        created_at: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveDatabase(db);
      res.status(201).json({ user: sanitizeUser(newUser, db) });
    }
  );

  app.patch(
    '/api/users/:id/toggle',
    authMiddleware,
    requireRole(['ADMIN'], 'Hanya ADMIN yang dapat mengubah status pengguna.'),
    (req: AuthedRequest, res: Response) => {
      const db = loadDatabase();
      const idx = db.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        return;
      }
      if (db.users[idx].id === req.authUser!.id) {
        res.status(400).json({ error: 'Tidak dapat menonaktifkan akun yang sedang Anda gunakan.' });
        return;
      }
      db.users[idx].active = !db.users[idx].active;
      saveDatabase(db);
      res.json({ user: sanitizeUser(db.users[idx], db) });
    }
  );

  // --- SURAT PENGANTAR ROUTES ---
  app.get('/api/surat', authMiddleware, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = loadDatabase();
    let surats = db.surats;

    if (user.role === 'RW') {
      const rtIdParam = typeof req.query.rt_id === 'string' ? req.query.rt_id : '';
      const rtsInRw = db.rts.filter((rt) => rt.rw_id === user.rw_id);
      const targetRtId = rtIdParam && rtsInRw.some((r) => r.id === rtIdParam) ? rtIdParam : rtsInRw[0]?.id;
      surats = targetRtId ? surats.filter((s) => s.rt_id === targetRtId) : [];
    } else if (user.role === 'LURAH') {
      const rwIdParam = typeof req.query.rw_id === 'string' ? req.query.rw_id : '';
      if (rwIdParam && rwIdParam !== 'all') {
        surats = surats.filter((s) => s.rw_id === rwIdParam);
      }
    }

    const enriched = surats.map((s) => {
      const warga = db.wargas.find((w) => w.nik === s.nik_warga);
      const rt = db.rts.find((r) => r.id === s.rt_id);
      const rw = db.rws.find((r) => r.id === s.rw_id);
      return {
        ...s,
        nama_warga: warga?.nama_lengkap ?? 'Warga Terhapus',
        alamat_warga: warga?.alamat ?? '-',
        rt_nomor: rt?.nomor_rt ?? '-',
        rw_nomor: rw?.nomor_rw ?? '-',
      };
    });

    res.json({ surats: enriched });
  });

  app.post(
    '/api/surat',
    authMiddleware,
    requireRole(['ADMIN', 'RT'], 'Hanya ADMIN dan RT yang dapat menerbitkan surat pengantar.'),
    (req: AuthedRequest, res: Response) => {
      const { nik_warga, jenis_surat, keperluan } = req.body as {
        nik_warga?: string;
        jenis_surat?: SiakSuratType;
        keperluan?: string;
      };
      if (!nik_warga || !jenis_surat || !keperluan?.trim()) {
        res.status(400).json({ error: 'NIK warga, jenis surat, dan keperluan wajib diisi.' });
        return;
      }
      const db = loadDatabase();
      const warga = db.wargas.find((w) => w.nik === nik_warga);
      if (!warga) {
        res.status(404).json({ error: `Warga dengan NIK ${nik_warga} tidak ditemukan.` });
        return;
      }
      const rt = db.rts.find((r) => r.id === warga.rt_id);
      const rw = db.rws.find((r) => r.id === warga.rw_id);
      const seq = String(db.surats.length + 14).padStart(3, '0');
      const newSurat = {
        id: `srt-${Date.now()}`,
        nomor_surat: `470/${seq}/RT${rt?.nomor_rt ?? '001'}-RW${rw?.nomor_rw ?? '001'}/XI/2026`,
        nik_warga: warga.nik,
        jenis_surat,
        keperluan: keperluan.trim(),
        tanggal_pengajuan: new Date().toISOString().slice(0, 10),
        status: 'Diterbitkan' as const,
        diterbitkan_oleh: req.authUser!.name,
        rt_id: warga.rt_id,
        rw_id: warga.rw_id,
      };
      db.surats.unshift(newSurat);
      db.audits.unshift({
        id: `aud-${Date.now()}`,
        actor_id: req.authUser!.id,
        actor_name: req.authUser!.name,
        actor_role: req.authUser!.role,
        action: 'ISSUE_SURAT',
        target_type: 'SURAT',
        target_id: newSurat.id,
        summary: `Menerbitkan ${jenis_surat} (${newSurat.nomor_surat}) untuk NIK ${warga.nik}`,
        timestamp: new Date().toISOString(),
      });
      saveDatabase(db);
      res.status(201).json({ surat: newSurat });
    }
  );

  // --- AUDIT LOG ROUTE (ADMIN & LURAH) ---
  app.get(
    '/api/audits',
    authMiddleware,
    requireRole(['ADMIN', 'LURAH'], 'Hanya ADMIN dan LURAH yang dapat melihat log aktivitas.'),
    (_req: AuthedRequest, res: Response) => {
      const db = loadDatabase();
      res.json({ audits: db.audits.slice(0, 40) });
    }
  );

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIAK Kelurahan server running on http://0.0.0.0:${PORT}`);
  });
}

type SiakSuratType =
  | 'Surat Keterangan Domisili'
  | 'Surat Pengantar KTP / KK'
  | 'Surat Keterangan Usaha'
  | 'Surat Keterangan Tidak Mampu'
  | 'Surat Pengantar Pindah';

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
