import type {
  AuditEntry,
  Rt,
  Rw,
  SafeUser,
  StatsSummary,
  SuratPengantar,
  UserRole,
  Warga,
} from './types.ts';

const TOKEN_STORAGE_KEY = 'siak_kelurahan_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  }
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: SafeUser }> {
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(): Promise<{ user: SafeUser }> {
  return requestJson('/api/auth/me');
}

export async function fetchDemoAccounts(): Promise<{ accounts: SafeUser[] }> {
  return requestJson('/api/auth/demo-accounts');
}

export async function fetchStats(params?: { rw_id?: string; rt_id?: string }): Promise<{ stats: StatsSummary }> {
  const qs = new URLSearchParams();
  if (params?.rw_id) qs.set('rw_id', params.rw_id);
  if (params?.rt_id) qs.set('rt_id', params.rt_id);
  const query = qs.toString();
  return requestJson(`/api/stats${query ? `?${query}` : ''}`);
}

export async function fetchWargas(params?: {
  search?: string;
  rw_id?: string;
  rt_id?: string;
  status?: string;
}): Promise<{ wargas: Warga[] }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.rw_id) qs.set('rw_id', params.rw_id);
  if (params?.rt_id) qs.set('rt_id', params.rt_id);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return requestJson(`/api/warga${query ? `?${query}` : ''}`);
}

export async function createWarga(payload: Partial<Warga>): Promise<{ warga: Warga }> {
  return requestJson('/api/warga', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWarga(nik: string, payload: Partial<Warga>): Promise<{ warga: Warga }> {
  return requestJson(`/api/warga/${encodeURIComponent(nik)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteWarga(nik: string): Promise<{ deleted: string }> {
  return requestJson(`/api/warga/${encodeURIComponent(nik)}`, {
    method: 'DELETE',
  });
}

export interface RwWithCounts extends Rw {
  total_rt: number;
  total_warga: number;
}

export interface RtWithCounts extends Rt {
  nomor_rw: string;
  total_warga: number;
}

export async function fetchWilayah(): Promise<{ rws: RwWithCounts[]; rts: RtWithCounts[] }> {
  return requestJson('/api/wilayah');
}

export async function createRw(payload: {
  nomor_rw: string;
  ketua_rw: string;
  telepon?: string;
  kelurahan?: string;
}): Promise<{ rw: Rw }> {
  return requestJson('/api/wilayah/rw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createRt(payload: {
  rw_id: string;
  nomor_rt: string;
  ketua_rt: string;
  telepon?: string;
}): Promise<{ rt: Rt }> {
  return requestJson('/api/wilayah/rt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchUsers(): Promise<{ users: SafeUser[] }> {
  return requestJson('/api/users');
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  rw_id?: string | null;
  rt_id?: string | null;
}): Promise<{ user: SafeUser }> {
  return requestJson('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleUserActive(id: string): Promise<{ user: SafeUser }> {
  return requestJson(`/api/users/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
  });
}

export interface EnrichedSurat extends SuratPengantar {
  nama_warga: string;
  alamat_warga: string;
  rt_nomor: string;
  rw_nomor: string;
}

export async function fetchSurats(params?: {
  rw_id?: string;
  rt_id?: string;
}): Promise<{ surats: EnrichedSurat[] }> {
  const qs = new URLSearchParams();
  if (params?.rw_id) qs.set('rw_id', params.rw_id);
  if (params?.rt_id) qs.set('rt_id', params.rt_id);
  const query = qs.toString();
  return requestJson(`/api/surat${query ? `?${query}` : ''}`);
}

export async function createSurat(payload: {
  nik_warga: string;
  jenis_surat: SuratPengantar['jenis_surat'];
  keperluan: string;
}): Promise<{ surat: SuratPengantar }> {
  return requestJson('/api/surat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAudits(): Promise<{ audits: AuditEntry[] }> {
  return requestJson('/api/audits');
}
