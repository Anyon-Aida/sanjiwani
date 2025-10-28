"use client";
import { useState } from "react";

export default function Login() {
  const [token, setToken] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (r.ok) location.href = "/admin/catalog";
    else alert("Hibás token");
  }
  return (
    <form onSubmit={submit} className="container-narrow mx-auto max-w-md my-20 space-y-4">
      <input className="w-full rounded border p-3" placeholder="Admin token" value={token} onChange={(e)=>setToken(e.target.value)} />
      <button className="rounded bg-[#9c7a58] px-4 py-2 text-white">Belépés</button>
    </form>
  );
}
