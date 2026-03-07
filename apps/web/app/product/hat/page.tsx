"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type RenderResult = {
  preview_base64: string;
  quality: { status: "PASS" | "FAIL"; score: number; reasons: string[]; metrics: Record<string, number> };
  palette: string[];
  canonical_hash: string;
};

const QUALITY_REASONS: Record<string, string> = {
  too_dark: "La foto está muy oscura. Intenta con mejor iluminación.",
  overexposed: "La foto está sobreexpuesta. Busca una con luz más natural.",
};

export default function HatPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRenderResult(null);
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  function reset() {
    setSelectedFile(null);
    setPhotoPreview(null);
    setRenderResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    setRenderResult(null);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: selectedFile });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Error al procesar la imagen.");
      } else {
        setRenderResult(data as RenderResult);
      }
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const qualityPass = renderResult?.quality.status === "PASS";

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="transition-colors hover:text-neutral-900">Inicio</Link>
        <span>›</span>
        <span className="text-neutral-900">Gorro personalizado</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">

        {/* ── Izquierda: info del producto ── */}
        <div className="space-y-7">
          <div>
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              Disponible ahora
            </span>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-neutral-900">
              Gorro bordado<br />personalizado 🧢
            </h1>
            <p className="mt-4 leading-relaxed text-neutral-600">
              Convierte la foto de tu mascota en un bordado irrepetible sobre un gorro premium.
              Perfecto para regalar o usar tú mismo. Producción artesanal en Chile.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-neutral-700">
            {[
              "🧢  Gorro unisex talla única, alta calidad",
              "🧵  Bordado con hilo premium de alta resistencia",
              "🎨  Diseño generado exclusivamente desde tu foto",
              "🚚  Despacho a todo Chile (7–10 días hábiles)",
              "🔒  Pago seguro con Webpay",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="rounded-2xl bg-amber-50 p-5 text-sm">
            <p className="font-bold text-amber-800">💡 Tips para mejores resultados</p>
            <ul className="mt-3 space-y-1 text-amber-700">
              <li>→ Usa una foto con buena luz natural</li>
              <li>→ La cara de tu mascota debe ser frontal y visible</li>
              <li>→ Mejor calidad de foto = mejor bordado</li>
            </ul>
          </div>
        </div>

        {/* ── Derecha: upload + resultado ── */}
        <div className="space-y-5">

          {/* Formulario de carga */}
          {!renderResult && (
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-7 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-neutral-900">
                Sube la foto de tu mascota
              </h2>

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
                  dragOver
                    ? "border-amber-400 bg-amber-50"
                    : photoPreview
                    ? "border-neutral-200 bg-white"
                    : "border-neutral-300 bg-neutral-50 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Tu foto" className="max-h-52 max-w-full rounded-lg object-contain" />
                ) : (
                  <>
                    <span className="text-5xl">📷</span>
                    <p className="text-sm font-semibold text-neutral-700">Haz clic o arrastra tu foto aquí</p>
                    <p className="text-xs text-neutral-400">JPG, PNG o WEBP — máx. 10 MB</p>
                  </>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {photoPreview && (
                <button type="button" onClick={reset} className="mt-2 text-xs text-neutral-400 transition-colors hover:text-neutral-600">
                  × Cambiar foto
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="mt-5 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generando bordado…
                  </span>
                ) : "Generar vista previa →"}
              </button>
            </form>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Resultado del render */}
          {renderResult && (
            <div className="space-y-4">

              {/* Preview del bordado */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-neutral-900">Vista previa del bordado</h2>
                <img
                  src={renderResult.preview_base64}
                  alt="Vista previa del bordado de tu mascota"
                  className="mx-auto w-full max-w-xs rounded-xl object-contain"
                />

                {/* Paleta de colores */}
                {renderResult.palette.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-500">Colores del bordado</p>
                    <div className="flex flex-wrap gap-2">
                      {renderResult.palette.map((hex) => (
                        <div key={hex} className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1">
                          <span className="h-3 w-3 rounded-full border border-neutral-200" style={{ backgroundColor: hex }} />
                          <span className="text-xs text-neutral-600 font-mono">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Calidad */}
              {qualityPass ? (
                <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                  ✅ <strong>Foto aprobada</strong> — calidad suficiente para bordado. Puntaje: {renderResult.quality.score}/100.
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
                  <p className="font-semibold">⚠️ Calidad de foto mejorable</p>
                  {renderResult.quality.reasons.map((r) => (
                    <p key={r}>→ {QUALITY_REASONS[r] ?? r}</p>
                  ))}
                  <p className="mt-2 text-amber-600">El bordado puede no quedar óptimo. Considera subir otra foto.</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/checkout"
                  className="flex-1 rounded-full bg-neutral-900 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
                >
                  Continuar al pago →
                </Link>
                <button
                  onClick={reset}
                  className="flex-1 rounded-full border border-neutral-300 py-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400"
                >
                  Cambiar foto
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
