"use client";
import { useEffect, useState } from "react";
import type { Catalog } from "@/lib/catalog";

export default function CatalogAdmin() {
  const [text, setText] = useState<string>("{}");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/catalog", { cache: "no-store" })
      .then(r => r.json())
      .then(j => setText(JSON.stringify(j.data, null, 2)))
      .catch(() => setText("{\"categories\":[],\"faq\":[]}"));
  }, []);

  async function save() {
    setStatus("Mentés…");
    try {
      const parsed = JSON.parse(text) as Catalog;
      const r = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!r.ok) throw new Error("Save failed");
      setStatus("Elmentve ✅");
    } catch (e:any) {
      setStatus("Hiba: " + (e?.message ?? "érvénytelen JSON"));
    }
  }

  return (
    <div className="container-narrow mx-auto my-8">
      <h1 className="text-2xl font-semibold mb-4">Katalógus (árak/szolgáltatások)</h1>
      <p className="mb-2 text-sm text-[var(--muted,#5b534a)]">
        Szerkeszd a JSON-t, majd <b>Mentés</b>. (Visszaállítás a Git-ből / KV-ből.)
      </p>
      <textarea
        value={text}
        onChange={(e)=>setText(e.target.value)}
        className="w-full h-[60vh] rounded border p-3 font-mono text-sm"
        spellCheck={false}
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} className="rounded bg-[#9c7a58] px-4 py-2 text-white">Mentés</button>
        <span className="text-sm">{status}</span>
      </div>
    </div>
  );
}
