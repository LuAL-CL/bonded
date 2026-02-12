export default function CheckoutPage() {
  return (
    <form className="space-y-4 rounded-xl bg-white p-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <label className="block">
        <input type="checkbox" required className="mr-2" />
        Acepto términos de personalización (sin retracto una vez iniciada producción).
      </label>
      <button className="rounded-full bg-neutral-900 px-4 py-2 text-white">Pagar con Webpay</button>
    </form>
  );
}
