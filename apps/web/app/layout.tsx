import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>
        <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="font-semibold text-xl">bonded.cl</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/product/hat">Custom Hat</Link>
              <Link href="/product/tshirt">Custom T-Shirt</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
        <footer className="mt-12 border-t py-6 text-sm text-neutral-700">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-4">
            <Link href="/legal/terms">Términos</Link>
            <Link href="/legal/privacy">Privacidad</Link>
            <Link href="/legal/shipping">Despacho</Link>
            <Link href="/legal/returns">Devoluciones</Link>
            <Link href="/legal/contact">Contacto</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
