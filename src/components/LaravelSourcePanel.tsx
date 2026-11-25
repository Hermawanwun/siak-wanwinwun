import JSZip from 'jszip';
import { Check, Copy, Download, FileCode2 } from 'lucide-react';
import React, { useState } from 'react';
import { LARAVEL_FILAMENT_FILES } from '../data/laravelFilamentFiles.ts';

export const LaravelSourcePanel: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState(LARAVEL_FILAMENT_FILES[0].path);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const activeFile =
    LARAVEL_FILAMENT_FILES.find((f) => f.path === selectedPath) ?? LARAVEL_FILAMENT_FILES[0];

  const handleCopy = () => {
    void navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      for (const file of LARAVEL_FILAMENT_FILES) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'siak-laravel-11.57-filament-5.10.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const categories = Array.from(new Set(LARAVEL_FILAMENT_FILES.map((f) => f.category)));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Laravel Framework 11.57.0</span>
            <span aria-hidden="true">·</span>
            <span>Filament v5.10.1</span>
            <span aria-hidden="true">·</span>
            <span>Primary Key NIK</span>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Kode Sumber Lengkap Laravel 11 & Filament v5
          </h2>
          <p className="text-xs text-zinc-600 max-w-2xl">
            Salin langsung atau unduh arsip proyek PHP lengkap berisi migrasi Primary Key NIK, Enum UserRole, Policy RBAC (Admin/RT/RW/Lurah), dan Filament v5 Resource.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleDownloadZip()}
          disabled={downloading}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Menyiapkan ZIP...' : 'Unduh Proyek (.zip)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* File Tree */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-4 space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1">
              <p className="px-2 text-xs font-semibold text-zinc-500">{cat}</p>
              <div className="space-y-0.5">
                {LARAVEL_FILAMENT_FILES.filter((f) => f.category === cat).map((file) => {
                  const active = file.path === activeFile.path;
                  return (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedPath(file.path)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                        active
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="font-mono truncate">{file.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs font-medium text-amber-400 truncate">
                {activeFile.path}
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{activeFile.summary}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono leading-relaxed text-slate-100 overflow-x-auto max-h-[640px] overflow-y-auto">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
