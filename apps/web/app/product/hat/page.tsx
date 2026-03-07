"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function HatPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  function reset() {
    setSelectedFile(null);
    setPreview(null);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: selectedFile });
      const data = await res.json();
      setMessage(data.message ?? "¡Vista previa generada!");
    } catch {
      setMessage("Ocurrió un error. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

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

        {/* ── Derecha: formulario de carga ── */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-neutral-900">
              Sube la foto de tu mascota
            </h2>

            {/* Zona de arrastre */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
                dragOver
                  ? "border-amber-400 bg-amber-50"
                  : preview
                  ? "border-neutral-200 bg-white"
                  : "border-neutral-300 bg-neutral-50 hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa de tu foto"
                  className="max-h-52 max-w-full rounded-lg object-contain"
                />
              ) : (
                <>
                  <span className="text-5xl">📷</span>
                  <p className="text-sm font-semibold text-neutral-700">
                    Haz clic o arrastra tu foto aquí
                  </p>
                  <p className="text-xs text-neutral-400">JPG, PNG o WEBP — máx. 10 MB</p>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {preview && (
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-xs text-neutral-400 transition-colors hover:text-neutral-600"
              >
                × Cambiar foto
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="mt-5 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Generando vista previa…" : "Generar vista previa →"}
            </button>
          </form>

          {message && (
            <div className="rounded-xl bg-amber-100 p-4 text-sm text-amber-800">
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
