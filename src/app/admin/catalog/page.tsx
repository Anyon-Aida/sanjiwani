// src/app/admin/catalog/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Catalog, Category, Service, Variant } from "@/app/api/admin/catalog/route";

const PRESET = [30, 45, 60, 90, 120, 180] as const;

const money = (v: number) =>
  new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(v);

const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/(^-|-$)/g, "");

export default function AdminCatalog() {
  const [data, setData] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [catIdx, setCatIdx] = useState(0);
  const [svcIdx, setSvcIdx] = useState(0);

  // GET
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/admin/catalog", { cache: "no-store" });
        const j: { ok: boolean; catalog?: Catalog } = await r.json();
        if (!j.ok || !j.catalog) throw new Error("Nem sikerült betölteni a katalógust.");
        setData(j.catalog);
        setCatIdx(0);
        setSvcIdx(0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedCat = useMemo<Category | undefined>(() => data?.categories[catIdx], [data, catIdx]);
  const selectedSvc = useMemo<Service | undefined>(() => selectedCat?.services[svcIdx], [selectedCat, svcIdx]);

  // ======== UI műveletek
  const addCat = () => {
    if (!data) return;
    const copy = structuredClone(data);
    const nextOrder = (copy.categories.at(-1)?.order ?? 0) + 1;
    copy.categories.push({ id: `cat-${Date.now()}`, name: "Új kategória", order: nextOrder, services: [] });
    setData(copy);
    setCatIdx(copy.categories.length - 1);
    setSvcIdx(0);
  };

  const delCat = (i: number) => {
    if (!data) return;
    const copy = structuredClone(data);
    copy.categories.splice(i, 1);
    setData(copy);
    setCatIdx(0);
    setSvcIdx(0);
  };

  const moveCat = (i: number, d: -1 | 1) => {
    if (!data) return;
    const copy = structuredClone(data);
    const to = i + d;
    if (to < 0 || to >= copy.categories.length) return;
    [copy.categories[i], copy.categories[to]] = [copy.categories[to], copy.categories[i]];
    // order normalizálás
    copy.categories.forEach((c, idx) => (c.order = idx + 1));
    setData(copy);
    setCatIdx(to);
  };

  const addSvc = () => {
    if (!data || !selectedCat) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    cat.services.push({ id: `svc-${Date.now()}`, name: "Új szolgáltatás", image: "", variants: [] });
    setData(copy);
    setSvcIdx(cat.services.length - 1);
  };

  const delSvc = (i: number) => {
    if (!data || !selectedCat) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    cat.services.splice(i, 1);
    setData(copy);
    setSvcIdx(0);
  };

  const moveSvc = (i: number, d: -1 | 1) => {
    if (!data || !selectedCat) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    const to = i + d;
    if (to < 0 || to >= cat.services.length) return;
    [cat.services[i], cat.services[to]] = [cat.services[to], cat.services[i]];
    setData(copy);
    setSvcIdx(to);
  };

  const changeSvcCategory = (serviceId: string, nextCatId: string) => {
    if (!data) return;
    const copy = structuredClone(data);

    const fromIdx = copy.categories.findIndex((c) => c.services.some((s) => s.id === serviceId));
    if (fromIdx < 0) return;
    const toIdx = copy.categories.findIndex((c) => c.id === nextCatId);
    if (toIdx < 0 || toIdx === fromIdx) return;

    const fromCat = copy.categories[fromIdx];
    const svcIndex = fromCat.services.findIndex((s) => s.id === serviceId);
    const [svc] = fromCat.services.splice(svcIndex, 1);
    copy.categories[toIdx].services.push(svc);

    setData(copy);
    setCatIdx(toIdx);
    setSvcIdx(copy.categories[toIdx].services.length - 1);
  };

  const upsertVariant = (dur: number, price: number) => {
    if (!data || !selectedSvc) return;
    const copy = structuredClone(data);
    const svc = copy.categories[catIdx].services[svcIdx];
    const hit = svc.variants.find((v) => v.durationMin === dur);
    if (hit) hit.priceHUF = price;
    else svc.variants.push({ durationMin: dur, priceHUF: price });
    svc.variants.sort((a, b) => a.durationMin - b.durationMin);
    setData(copy);
  };

  const delVariant = (dur: number) => {
    if (!data || !selectedSvc) return;
    const copy = structuredClone(data);
    const svc = copy.categories[catIdx].services[svcIdx];
    svc.variants = svc.variants.filter((v) => v.durationMin !== dur);
    setData(copy);
  };

  // ======== SAVE
  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      // egyszerű kliens validáció
      for (const c of data.categories) {
        if (!c.name.trim()) throw new Error("Üres kategórianév található.");
        for (const s of c.services) {
          if (!s.name.trim()) throw new Error("Üres szolgáltatásnév található.");
          const seen = new Set<number>();
          for (const v of s.variants) {
            if (seen.has(v.durationMin)) {
              throw new Error(`A(z) "${s.name}" azonos percértéket kétszer tartalmaz (${v.durationMin}).`);
            }
            seen.add(v.durationMin);
          }
        }
      }

      const r = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catalog: data }),
      });
      const j: { ok: boolean; message?: string } = await r.json();
      if (!j.ok) throw new Error(j.message || "Mentési hiba.");
      setToast("Elmentve.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // ======== RENDER
  if (loading) return <Shell>Betöltés…</Shell>;
  if (error && !data) return <Shell error={error} />;

  return (
    <Shell toast={toast} error={error}>
      {/* Fejléc */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Katalógus szerkesztő</h1>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-black/90 px-4 py-2 text-white shadow hover:bg-black disabled:opacity-50"
        >
          {saving ? "Mentés…" : "Mentés"}
        </button>
      </div>

      {/* 3 oszlop */}
      <div className="grid gap-4 md:grid-cols-[280px_1fr_1.1fr]">
        {/* KATEGÓRIÁK */}
        <Panel title="Kategóriák" actionLabel="+ Új" onAction={addCat}>
          <ul className="space-y-1">
            {data!.categories.map((c, i) => (
              <li key={c.id} className={`flex items-center justify-between rounded-lg px-2 py-1 ${i === catIdx ? "bg-zinc-100" : ""}`}>
                <button className="flex-1 text-left" onClick={() => { setCatIdx(i); setSvcIdx(0); }}>
                  {c.name}
                </button>
                <div className="flex items-center gap-1">
                  <IconBtn label="Fel" onClick={() => moveCat(i, -1)}>↑</IconBtn>
                  <IconBtn label="Le"  onClick={() => moveCat(i, 1)}>↓</IconBtn>
                  <IconBtn label="Törlés" onClick={() => delCat(i)}>✕</IconBtn>
                </div>
              </li>
            ))}
          </ul>

          {selectedCat && (
            <div className="mt-3 space-y-1">
              <Label text="Kategória neve" />
              <input
                value={selectedCat.name}
                onChange={(e) => {
                  const copy = structuredClone(data!);
                  copy.categories[catIdx].name = e.target.value;
                  setData(copy);
                }}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          )}
        </Panel>

        {/* SZOLGÁLTATÁSOK */}
        <Panel title="Szolgáltatások" actionLabel="+ Új" onAction={addSvc}>
          {!selectedCat ? (
            <Muted>Válassz kategóriát.</Muted>
          ) : selectedCat.services.length === 0 ? (
            <Muted>Még nincs szolgáltatás ebben a kategóriában.</Muted>
          ) : (
            <ul className="space-y-1">
              {selectedCat.services.map((s, i) => (
                <li key={s.id} className={`flex items-center justify-between rounded-lg px-2 py-1 ${i === svcIdx ? "bg-zinc-100" : ""}`}>
                  <button className="flex-1 text-left" onClick={() => setSvcIdx(i)}>
                    {s.name}
                  </button>
                  <div className="flex items-center gap-1">
                    <IconBtn label="Fel" onClick={() => moveSvc(i, -1)}>↑</IconBtn>
                    <IconBtn label="Le"  onClick={() => moveSvc(i, 1)}>↓</IconBtn>
                    <IconBtn label="Törlés" onClick={() => delSvc(i)}>✕</IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* RÉSZLETEK */}
        <Panel title="Részletek">
          {!selectedSvc ? (
            <Muted>Válassz szolgáltatást.</Muted>
          ) : (
            <div className="space-y-3">
              {/* Kategória váltó */}
              <div>
                <Label text="Kategória" />
                <select
                  value={data!.categories[catIdx].id}
                  onChange={(e) => changeSvcCategory(selectedSvc.id, e.target.value)}
                  className="w-full h-[40px] rounded-lg border px-3"
                >
                  {data!.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Név */}
              <div>
                <Label text="Név" />
                <input
                  value={selectedSvc.name}
                  onChange={(e) => {
                    const copy = structuredClone(data!);
                    copy.categories[catIdx].services[svcIdx].name = e.target.value;
                    setData(copy);
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              {/* Slug + Kép */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label text="Azonosító (slug)" />
                  <input
                    value={selectedSvc.id}
                    onChange={(e) => {
                      const copy = structuredClone(data!);
                      copy.categories[catIdx].services[svcIdx].id = e.target.value;
                      setData(copy);
                    }}
                    onBlur={() => {
                      if (!selectedSvc.id.trim()) {
                        const copy = structuredClone(data!);
                        copy.categories[catIdx].services[svcIdx].id = slugify(selectedSvc.name || "svc");
                        setData(copy);
                      }
                    }}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <Label text="Kép (opcionális)" />
                  <input
                    value={selectedSvc.image ?? ""}
                    onChange={(e) => {
                      const copy = structuredClone(data!);
                      copy.categories[catIdx].services[svcIdx].image = e.target.value;
                      setData(copy);
                    }}
                    placeholder="/services/traditional-thai.png"
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              {/* Árlista */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label text="Árlista (percek → Ft)" />
                  <div className="flex gap-1">
                    {PRESET.map((d) => (
                      <button
                        key={d}
                        onClick={() => upsertVariant(d, 0)}
                        className="rounded border px-2 py-0.5 text-xs"
                        title={`${d} perc sor hozzáadása`}
                      >
                        + {d}p
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSvc.variants.length === 0 ? (
                  <Muted>Még nincs ár megadva ehhez a szolgáltatáshoz.</Muted>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-1 pr-2">Perc</th>
                        <th className="py-1 pr-2">Ár</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSvc.variants.map((v: Variant) => (
                        <tr key={v.durationMin} className="border-b last:border-none">
                          <td className="py-1 pr-2">{v.durationMin} p</td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={v.priceHUF}
                              onChange={(e) => upsertVariant(v.durationMin, Number.parseInt(e.target.value || "0", 10))}
                              className="w-40 rounded border px-2 py-1"
                            />
                            <span className="ml-2 text-xs text-zinc-500">{v.priceHUF ? money(v.priceHUF) : ""}</span>
                          </td>
                          <td className="py-1 text-right">
                            <button onClick={() => delVariant(v.durationMin)} className="rounded border px-2 py-0.5 text-xs">
                              Törlés
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </Shell>
  );
}

/* ===== Kisegítő komponensek a letisztult UI-hoz ===== */

function Shell(props: { children?: React.ReactNode; toast?: string | null; error?: string | null }) {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-6">
      {props.toast && <div className="mb-3 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">{props.toast}</div>}
      {props.error && <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">{props.error}</div>}
      {props.children}
    </div>
  );
}

function Panel(props: { title: string; children: React.ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{props.title}</h3>
        {props.actionLabel && props.onAction && (
          <button onClick={props.onAction} className="rounded-lg border px-2 py-1 text-sm hover:bg-zinc-50">
            {props.actionLabel}
          </button>
        )}
      </div>
      {props.children}
    </div>
  );
}

function IconBtn(props: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      className="rounded-lg border px-2 py-0.5 text-sm hover:bg-zinc-50"
    >
      {props.children}
    </button>
  );
}

function Label(props: { text: string }) {
  return <div className="text-xs text-zinc-500">{props.text}</div>;
}

function Muted(props: { children: React.ReactNode }) {
  return <div className="text-sm text-zinc-500">{props.children}</div>;
}
