import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-20">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-amber-50 to-white px-8 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
          Bordado artesanal · Hecho en Chile
        </p>
        <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-6xl">
          Tu mascota,<br />
          <span className="text-amber-500">en cada prenda.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
          Sube una foto de tu perro o gato, generamos el diseño bordado al instante
          y te lo enviamos a cualquier rincón de Chile.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/product/hat"
            className="rounded-full bg-neutral-900 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-neutral-700"
          >
            Crear mi gorro →
          </Link>
          <Link
            href="/product/tshirt"
            className="rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-base font-semibold text-neutral-700 transition-colors hover:border-neutral-400"
          >
            Ver poleras
          </Link>
        </div>
        {/* Patitas decorativas */}
        <span className="pointer-events-none absolute -right-4 -top-4 select-none text-9xl opacity-10" aria-hidden="true">🐾</span>
        <span className="pointer-events-none absolute -bottom-6 -left-4 select-none text-9xl opacity-10" aria-hidden="true">🐾</span>
      </section>

      {/* ── ¿Cómo funciona? ── */}
      <section>
        <h2 className="text-center text-3xl font-bold text-neutral-900">¿Cómo funciona?</h2>
        <p className="mt-2 text-center text-neutral-500">Tres simples pasos para tener la prenda perfecta</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {([
            { icon: "📷", title: "Sube una foto", desc: "Elige la mejor foto frontal de tu mascota. Mejor iluminación, mejor resultado." },
            { icon: "✨", title: "Generamos el diseño", desc: "Convertimos la foto en un bordado digital único. Puedes ver la vista previa antes de confirmar." },
            { icon: "📦", title: "Recíbelo en casa", desc: "Producimos y despachamos a todo Chile. Tiempo estimado: 7 a 10 días hábiles." },
          ] as const).map((step) => (
            <div key={step.title} className="rounded-2xl bg-white p-7 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
                {step.icon}
              </div>
              <h3 className="font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Productos ── */}
      <section>
        <h2 className="text-center text-3xl font-bold text-neutral-900">Nuestros productos</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex h-44 items-center justify-center rounded-xl bg-amber-50 text-7xl">🧢</div>
            <h3 className="text-xl font-semibold">Gorro bordado personalizado</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Gorro unisex de alta calidad con el bordado de tu mascota en el frente.
              Hilo premium de alta resistencia, ideal para todo el año.
            </p>
            <Link
              href="/product/hat"
              className="mt-5 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Personalizar →
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex h-44 items-center justify-center rounded-xl bg-amber-50 text-7xl">👕</div>
            <h3 className="text-xl font-semibold">Polera bordada personalizada</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Polera 100% algodón con el bordado en el pecho. Disponible en varios colores
              para que la combinas como quieras.
            </p>
            <Link
              href="/product/tshirt"
              className="mt-5 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Personalizar →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Por qué Bonded ── */}
      <section className="rounded-3xl bg-neutral-900 px-8 py-14 text-white">
        <h2 className="text-center text-3xl font-bold">¿Por qué elegir Bonded?</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { icon: "🧵", title: "Bordado premium", desc: "Hilo de alta resistencia, colores vivos que aguantan lavado tras lavado." },
            { icon: "🐶", title: "Diseño único", desc: "El bordado de tu mascota es irrepetible, generado especialmente para ti." },
            { icon: "🚚", title: "Envío a Chile", desc: "Despachamos desde Santiago a todo el territorio nacional." },
            { icon: "❤️", title: "Hecho con amor", desc: "Cada prenda pasa por control de calidad antes de llegar a tus manos." },
          ] as const).map((f) => (
            <div key={f.title} className="text-center">
              <div className="mb-3 text-4xl">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="pb-6 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">¿Listo para crear la tuya?</h2>
        <p className="mt-3 text-neutral-600">Tu mascota merece ser la estrella de cada prenda.</p>
        <Link
          href="/product/hat"
          className="mt-7 inline-block rounded-full bg-amber-500 px-9 py-4 text-base font-bold text-white shadow-md transition-colors hover:bg-amber-400"
        >
          Empezar ahora →
        </Link>
      </section>

    </div>
  );
}
