import { featureDisabledMessage, isDemoMode } from "@/lib/flags";

export default function CheckoutPage() {
  const demo = isDemoMode();

  return (
    <form className="space-y-4 rounded-xl bg-white p-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <label className="block">
        <input type="checkbox" required className="mr-2" disabled={demo} />
        Acepto términos de personalización (sin retracto una vez iniciada producción).
      </label>
      {demo ? <p className="rounded bg-amber-100 p-2 text-sm">{featureDisabledMessage("Payment")}</p> : null}
      <button className="rounded-full bg-neutral-900 px-4 py-2 text-white disabled:opacity-40" disabled={demo}>
        {demo ? featureDisabledMessage("Payment") : "Pagar con Webpay"}
      </button>
    </form>
  );
}
