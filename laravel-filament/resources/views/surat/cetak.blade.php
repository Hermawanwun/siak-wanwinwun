<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $surat->jenis_surat }} - {{ $surat->nomor_surat }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; max-width: 720px; margin: 40px auto; line-height: 1.6; }
        .kop { text-align: center; border-bottom: 3px solid #111827; padding-bottom: 12px; margin-bottom: 24px; }
        .judul { text-align: center; margin-bottom: 24px; }
        .judul h2 { margin: 0; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 4px 6px; vertical-align: top; }
        .ttd { margin-top: 48px; text-align: right; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 16px;">
        <button onclick="window.print()">Cetak Surat</button>
    </div>
    <div class="kop">
        <div><strong>PEMERINTAH KELURAHAN SUKAMAJU</strong></div>
        <div><strong>RT {{ $surat->rt->nomor_rt ?? '-' }} / RW {{ $surat->rw->nomor_rw ?? '-' }}</strong></div>
    </div>
    <div class="judul">
        <h2>{{ $surat->jenis_surat }}</h2>
        <div>Nomor: {{ $surat->nomor_surat }}</div>
    </div>
    <p>Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya bahwa:</p>
    <table>
        <tr><td style="width: 180px;">Nama Lengkap</td><td>: <strong>{{ $surat->warga->nama_lengkap ?? '-' }}</strong></td></tr>
        <tr><td>NIK (Primary Key)</td><td>: {{ $surat->nik_warga }}</td></tr>
        <tr><td>Alamat</td><td>: {{ $surat->warga->alamat ?? '-' }}</td></tr>
        <tr><td>Keperluan</td><td>: {{ $surat->keperluan }}</td></tr>
    </table>
    <p>Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
    <div class="ttd">
        <div>Diterbitkan tanggal {{ $surat->tanggal_pengajuan?->format('d-m-Y') }}</div>
        <div style="margin-top: 64px;"><strong>{{ $surat->diterbitkan_oleh }}</strong></div>
    </div>
</body>
</html>