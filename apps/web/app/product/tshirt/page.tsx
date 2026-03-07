import Link from "next/link";

export default function TshirtPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="transition-colors hover:text-neutral-900">Inicio</Link>
        <span>›</span>
        <span className="text-neutral-900">Polera personalizada</span>
      </nav>

      <div className="rounded-3xl bg-white px-8 py-16 text-center shadow-sm">
        <div className="text-7xl">👕</div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-900">
          Polera bordada<br />personalizada
        </h1>
        <p className="mx-auto mt-4 max-w-md text-neutral-600">
          Estamos trabajando en esta sección. Muy pronto podrás personalizar
          tu polera con el bordado de tu mascota.
        </p>

        <div className="mx-auto mt-8 max-w-xs rounded-2xl bg-amber-50 p-5 text-left space-y-2 text-sm text-amber-800">
          <p className="font-bold">Lo que viene:</p>
          <p>👕  Polera 100% algodón premium</p>
          <p>🎨  Bordado personalizado en el pecho</p>
          <p>🌈  Varios colores disponibles</p>
          <p>🚚  Despacho a todo Chile</p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/product/hat"
            className="rounded-full bg-neutral-900 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Mientras tanto, prueba el gorro →
          </Link>
          <Link
            href="/"
            className="rounded-full border border-neutral-300 px-7 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-400"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
