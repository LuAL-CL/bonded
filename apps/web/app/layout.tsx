import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Bonded · Bordado personalizado para tu mascota",
  description:
    "Sube una foto de tu perro o gato y recibe tu gorro o polera con bordado premium, a cualquier lugar de Chile.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>
        <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-neutral-900">
              <span className="text-2xl leading-none">🐾</span>
              bonded.cl
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link href="/product/hat" className="text-neutral-600 transition-colors hover:text-neutral-900">
                Gorros
              </Link>
              <Link href="/product/tshirt" className="text-neutral-600 transition-colors hover:text-neutral-900">
                Poleras
              </Link>
              <Link
                href="/product/hat"
                className="rounded-full bg-neutral-900 px-4 py-1.5 text-white transition-colors hover:bg-neutral-700"
              >
                Crear ahora
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>

        <footer className="border-t border-amber-100 bg-white py-10">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-lg font-extrabold">
                  <span>🐾</span> bonded.cl
                </p>
                <p className="mt-1 text-sm text-neutral-500">Bordado premium para tu mejor amigo.</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                <Link href="/legal/terms" className="transition-colors hover:text-neutral-900">Términos</Link>
                <Link href="/legal/privacy" className="transition-colors hover:text-neutral-900">Privacidad</Link>
                <Link href="/legal/shipping" className="transition-colors hover:text-neutral-900">Despacho</Link>
                <Link href="/legal/returns" className="transition-colors hover:text-neutral-900">Devoluciones</Link>
                <Link href="/legal/contact" className="transition-colors hover:text-neutral-900">Contacto</Link>
              </div>
            </div>
            <p className="mt-8 text-xs text-neutral-400">© 2025 Bonded SpA. Santiago, Chile. Todos los derechos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
