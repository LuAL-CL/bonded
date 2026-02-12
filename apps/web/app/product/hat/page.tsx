"use client";

import { useState } from "react";

export default function HatPage() {
  const [message, setMessage] = useState("");

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("photo") as File;
    const res = await fetch("/api/upload", { method: "POST", body: file });
    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Bonded Custom Hat</h1>
      <form onSubmit={upload} className="space-y-3 rounded-xl bg-white p-6">
        <label className="block text-sm font-medium" htmlFor="photo">Foto frontal de tu mascota</label>
        <input id="photo" name="photo" type="file" accept="image/*" required className="block" />
        <button className="rounded-full bg-neutral-900 px-4 py-2 text-white">Generar preview</button>
      </form>
      {message && <p className="rounded-lg bg-amber-100 p-3">{message}</p>}
    </div>
  );
}
