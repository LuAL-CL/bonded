import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold">Bordado premium para tu mascota.</h1>
        <p className="mt-3 max-w-2xl text-neutral-700">Sube una foto, genera vista previa bordada determinística y recibe tu gorro Bonded listo para usar.</p>
        <Link href="/product/hat" className="mt-5 inline-block rounded-full bg-neutral-900 px-5 py-3 text-white">Crear mi gorro</Link>
      </section>
    </div>
  );
}
