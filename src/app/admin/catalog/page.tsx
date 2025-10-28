"use client";

import { useEffect, useMemo, useState } from "react";

/* ===== Típusok – maradjon kompatibilis a jelenlegi API-val ===== */

type Variant = { durationMin: number; priceHUF: number };
type Service = { id: string; name: string; image?: string; variants: Variant[] };
type Category = { id: string; name: string; order: number; services: Service[] };
type Catalog = { categories: Category[]; faq: { q: string; a: string }[] };

/* ===== Kisegítők ===== */

const PRESET_DURS = [30, 45, 60, 90, 120, 180];
const HUF = (v: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(v);

const slugify = (t: string) =>
  t
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)/g, "");

/* =====  UI  ===== */

export default function AdminCatalogPage() {
  const [data, setData] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // kiválasztott elem
  const [catIdx, setCatIdx] = useState<number>(0);
  const [svcIdx, setSvcIdx] = useState<number>(0);

  // JSON “haladó” mód mutatás
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");
  

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
        try {
        const res = await fetch("/api/admin/catalog", { cache: "no-store" });
        const j = await res.json();

        // --- TOLERÁNS PARSER: több válaszformátumot elfogad ---
        let catalog: Catalog | null = null;

        // 1) Ha a válasz közvetlenül a katalógus (nincs ok)
        if (j && j.categories && Array.isArray(j.categories)) {
            catalog = j as Catalog;
        }

        // 2) Ha { ok, catalog } sémában jön
        if (!catalog && j?.ok && j?.catalog) {
            catalog = j.catalog as Catalog;
        }

        // 3) Ha { ok, doc } vagy { ok, data } sémában jön
        if (!catalog && j?.ok && (j.doc || j.data)) {
            catalog = (j.doc || j.data) as Catalog;
        }

        // 4) Ha { ok, text } és string az adat
        if (!catalog && j?.ok && typeof j?.text === "string") {
            try { catalog = JSON.parse(j.text) as Catalog; } catch {}
        }

        // 5) Végső esély: ha van body string mező
        if (!catalog && typeof j?.body === "string") {
            try { catalog = JSON.parse(j.body) as Catalog; } catch {}
        }

        if (!catalog) {
            throw new Error("A katalógus adatait nem sikerült kinyerni az API válaszából.");
        }

        setData(catalog);
        setJsonText(JSON.stringify(catalog, null, 2));
        } catch (e: any) {
        setErr(e?.message || "Ismeretlen hiba.");
        } finally {
        setLoading(false);
        }
    })();
  }, []);

  // kiválasztott mutatók “safe”
  const selectedCat = useMemo(
    () => (data ? data.categories[catIdx] : undefined),
    [data, catIdx]
  );
  const selectedSvc = useMemo(
    () => (selectedCat ? selectedCat.services[svcIdx] : undefined),
    [selectedCat, svcIdx]
  );

  const selectedSvcCatIdx = useMemo(() => {
  if (!data || !selectedSvc) return -1;
  return findCategoryIndexOfService(selectedSvc.id);
}, [data, selectedSvc?.id]);

  /* ======= Műveletek ======= */

  const addCategory = () => {
    if (!data) return;
    const copy = structuredClone(data);
    const order = Math.max(0, ...copy.categories.map((c) => c.order)) + 1;
    copy.categories.push({
      id: `cat-${Date.now()}`,
      name: "Új kategória",
      order,
      services: [],
    });
    setData(copy);
    setCatIdx(copy.categories.length - 1);
    setSvcIdx(0);
  };

  const delCategory = (index: number) => {
    if (!data) return;
    const copy = structuredClone(data);
    copy.categories.splice(index, 1);
    setData(copy);
    setCatIdx(0);
    setSvcIdx(0);
  };

  const moveCategory = (index: number, dir: -1 | 1) => {
    if (!data) return;
    const copy = structuredClone(data);
    const to = index + dir;
    if (to < 0 || to >= copy.categories.length) return;
    const tmp = copy.categories[index];
    copy.categories[index] = copy.categories[to];
    copy.categories[to] = tmp;
    // korrigáljuk az order-t szépen 1..n
    copy.categories = copy.categories.map((c, i) => ({ ...c, order: i + 1 }));
    setData(copy);
    setCatIdx(to);
  };

  const addService = () => {
    if (!selectedCat || !data) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    cat.services.push({
      id: `svc-${Date.now()}`,
      name: "Új szolgáltatás",
      image: "",
      variants: [],
    });
    setData(copy);
    setSvcIdx(cat.services.length - 1);
  };

  const delService = (index: number) => {
    if (!selectedCat || !data) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    cat.services.splice(index, 1);
    setData(copy);
    setSvcIdx(0);
  };

  const moveService = (index: number, dir: -1 | 1) => {
    if (!selectedCat || !data) return;
    const copy = structuredClone(data);
    const cat = copy.categories[catIdx];
    const to = index + dir;
    if (to < 0 || to >= cat.services.length) return;
    const tmp = cat.services[index];
    cat.services[index] = cat.services[to];
    cat.services[to] = tmp;
    setData(copy);
    setSvcIdx(to);
  };
  
  /** Megadja, melyik kategóriában van a szolgáltatás (index), vagy -1 ha nincs meg. */
    function findCategoryIndexOfService(serviceId: string): number {
    if (!data) return -1;
    return data.categories.findIndex((cat) =>
        cat.services.some((s) => s.id === serviceId)
    );
    }

    /** Áthelyezi a szolgáltatást egy másik kategóriába (kategória ID alapján). */
    function moveServiceToCategory(serviceId: string, nextCatId: string) {
    if (!data) return;

    const fromCatIdx = findCategoryIndexOfService(serviceId);
    if (fromCatIdx < 0) return;

    const toCatIdx = data.categories.findIndex((c) => c.id === nextCatId);
    if (toCatIdx < 0 || toCatIdx === fromCatIdx) return;

    const copy = structuredClone(data);

    // kivágjuk a forrás kategóriából
    const fromCat = copy.categories[fromCatIdx];
    const svcIndex = fromCat.services.findIndex((s) => s.id === serviceId);
    if (svcIndex < 0) return;

    const [svc] = fromCat.services.splice(svcIndex, 1);

    // betesszük a cél kategóriába a végére
    copy.categories[toCatIdx].services.push(svc);

    // UI állapot frissítés
    setData(copy);
    setCatIdx(toCatIdx);
    setSvcIdx(copy.categories[toCatIdx].services.length - 1);
    }



  const upsertVariant = (dur: number, price: number) => {
    if (!selectedSvc || !data) return;
    const copy = structuredClone(data);
    const svc = copy.categories[catIdx].services[svcIdx];
    const hit = svc.variants.find((v) => v.durationMin === dur);
    if (hit) hit.priceHUF = price;
    else svc.variants.push({ durationMin: dur, priceHUF: price });
    // rendezzük idő szerint
    svc.variants.sort((a, b) => a.durationMin - b.durationMin);
    setData(copy);
  };

  const delVariant = (dur: number) => {
    if (!selectedSvc || !data) return;
    const copy = structuredClone(data);
    const svc = copy.categories[catIdx].services[svcIdx];
    svc.variants = svc.variants.filter((v) => v.durationMin !== dur);
    setData(copy);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      // minimális validáció
      for (const c of data.categories) {
        if (!c.name.trim()) throw new Error("Van üres kategórianév.");
        for (const s of c.services) {
          if (!s.name.trim()) throw new Error("Van üres szolgáltatásnév.");
          const seen = new Set<number>();
          for (const v of s.variants) {
            if (seen.has(v.durationMin))
              throw new Error(
                `"${s.name}" azonos percérték duplán szerepel (${v.durationMin}).`
              );
            seen.add(v.durationMin);
          }
        }
      }

      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catalog: data }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.message || "Mentési hiba.");
      setMsg("Elmentve.");
    } catch (e: any) {
      setErr(e?.message || "Ismeretlen hiba.");
    } finally {
      setSaving(false);
    }
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as Catalog;
      setData(parsed);
      setMsg("JSON betöltve a szerkesztőbe (mentés még nem történt).");
      setErr(null);
    } catch {
      setErr("Érvénytelen JSON.");
    }
  };

  /* ======= Render ======= */

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-10 text-[15px]">
        Betöltés…
      </div>
    );
  }
  if (err && !data) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-10 text-[15px] text-red-700">
        {err}
      </div>
    );
  }
  if (!data) {
    return (
        <div className="mx-auto max-w-[1120px] px-4 py-10 text-[15px] text-red-700">
        Nem sikerült megjeleníteni a katalógust (nincs adat). Próbáld frissíteni az oldalt,
        vagy ellenőrizd az API választ a /api/admin/catalog végponton.
        </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 md:px-6 py-6">
      <h1 className="font-heading text-[28px] md:text-[36px] mb-2">
        Katalógus (árak / szolgáltatások)
      </h1>
      <p className="text-[13.5px] text-[var(--color-muted)] mb-4">
        Válaszd ki balra a <b>kategóriát</b>, középen a <b>szolgáltatást</b>,
        jobbra pedig szerkesztheted a részleteket és az árakat.
      </p>

      {/* Haladó / JSON */}
      <details className="mb-5">
        <summary
          className="cursor-pointer select-none text-[14px] font-semibold"
          onClick={() => setShowJson((v) => !v)}
        >
          Haladó · JSON import/export
        </summary>
        {showJson && (
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={18}
              className="w-full rounded-lg border p-3 font-mono text-[13px]"
              style={{ borderColor: "var(--color-line)" }}
            />
            <div className="space-y-2">
              <div className="text-[13px] text-[var(--color-muted)]">
                Ez csak a szerkesztőbe tölti be a JSON-t. <b>Menteni</b> alul tudsz.
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-2"
                  onClick={applyJson}
                >
                  Betöltés a szerkesztőbe
                </button>
                <button
                  className="rounded-md border px-3 py-2"
                  onClick={() =>
                    setJsonText(JSON.stringify(data, null, 2))
                  }
                >
                  Frissít (aktuális állapot)
                </button>
              </div>
            </div>
          </div>
        )}
      </details>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Kategóriák */}
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-line)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Kategóriák</h3>
            <button className="rounded-md border px-2 py-1" onClick={addCategory}>
              + Új
            </button>
          </div>
          <ul className="space-y-1">
            {data.categories.map((c, i) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${
                  i === catIdx ? "bg-[var(--color-bg)]" : ""
                }`}
              >
                <button
                  className="text-left flex-1"
                  onClick={() => {
                    setCatIdx(i);
                    setSvcIdx(0);
                  }}
                >
                  {c.name}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded border px-2 py-0.5"
                    onClick={() => moveCategory(i, -1)}
                    title="Fel"
                  >
                    ↑
                  </button>
                  <button
                    className="rounded border px-2 py-0.5"
                    onClick={() => moveCategory(i, 1)}
                    title="Le"
                  >
                    ↓
                  </button>
                  <button
                    className="rounded border px-2 py-0.5"
                    onClick={() => delCategory(i)}
                    title="Törlés"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {selectedCat && (
            <div className="mt-3 space-y-2">
              <label className="block text-[12px] text-[var(--color-muted)]">
                Kategória neve
              </label>
              <input
                value={selectedCat.name}
                onChange={(e) => {
                  const copy = structuredClone(data);
                  copy.categories[catIdx].name = e.target.value;
                  setData(copy);
                }}
                className="w-full rounded-md border px-3 py-2"
                style={{ borderColor: "var(--color-line)" }}
              />
            </div>
          )}
        </div>

        {/* Szolgáltatások */}
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-line)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Szolgáltatások</h3>
            <button className="rounded-md border px-2 py-1" onClick={addService}>
              + Új
            </button>
          </div>
          {!selectedCat ? (
            <div className="text-[13px] text-[var(--color-muted)]">
              Válassz kategóriát.
            </div>
          ) : selectedCat.services.length === 0 ? (
            <div className="text-[13px] text-[var(--color-muted)]">
              Még nincs szolgáltatás ebben a kategóriában.
            </div>
          ) : (
            <ul className="space-y-1">
              {selectedCat.services.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${
                    i === svcIdx ? "bg-[var(--color-bg)]" : ""
                  }`}
                >
                  <button className="text-left flex-1" onClick={() => setSvcIdx(i)}>
                    {s.name}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      className="rounded border px-2 py-0.5"
                      onClick={() => moveService(i, -1)}
                      title="Fel"
                    >
                      ↑
                    </button>
                    <button
                      className="rounded border px-2 py-0.5"
                      onClick={() => moveService(i, 1)}
                      title="Le"
                    >
                      ↓
                    </button>
                    <button
                      className="rounded border px-2 py-0.5"
                      onClick={() => delService(i)}
                      title="Törlés"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Részletek / árak */}
        {selectedSvc && (
        <div>
            <label className="block text-[12px] text-[var(--color-muted)]">Kategória</label>
            <select
            value={
                selectedSvcCatIdx >= 0
                ? data.categories[selectedSvcCatIdx].id
                : data.categories[catIdx].id
            }
            onChange={(e) => moveServiceToCategory(selectedSvc.id, e.target.value)}
            className="w-full h-[40px] rounded-md border px-3 text-[14px]"
            style={{ borderColor: "var(--color-line)" }}
            >
            {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                {c.name}
                </option>
            ))}
            </select>
        </div>
        )}

        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-line)" }}>
          <h3 className="font-semibold mb-2">Részletek</h3>
          {!selectedSvc ? (
            <div className="text-[13px] text-[var(--color-muted)]">
              Válassz szolgáltatást.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-[var(--color-muted)]">
                  Név
                </label>
                <input
                  value={selectedSvc.name}
                  onChange={(e) => {
                    const copy = structuredClone(data);
                    copy.categories[catIdx].services[svcIdx].name = e.target.value;
                    setData(copy);
                  }}
                  className="w-full rounded-md border px-3 py-2"
                  style={{ borderColor: "var(--color-line)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[var(--color-muted)]">
                    Azonosító (slug)
                  </label>
                  <input
                    value={selectedSvc.id}
                    onChange={(e) => {
                      const copy = structuredClone(data);
                      copy.categories[catIdx].services[svcIdx].id = e.target.value;
                      setData(copy);
                    }}
                    onBlur={() => {
                      if (!selectedSvc.id.trim()) {
                        const copy = structuredClone(data);
                        copy.categories[catIdx].services[svcIdx].id = slugify(
                          selectedSvc.name || "svc"
                        );
                        setData(copy);
                      }
                    }}
                    className="w-full rounded-md border px-3 py-2"
                    style={{ borderColor: "var(--color-line)" }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--color-muted)]">
                    Kép (opcionális)
                  </label>
                  <input
                    value={selectedSvc.image ?? ""}
                    onChange={(e) => {
                      const copy = structuredClone(data);
                      copy.categories[catIdx].services[svcIdx].image =
                        e.target.value;
                      setData(copy);
                    }}
                    placeholder="/services/traditional-thai.png"
                    className="w-full rounded-md border px-3 py-2"
                    style={{ borderColor: "var(--color-line)" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] text-[var(--color-muted)]">
                    Árlista (percek → Ft)
                  </label>
                  <div className="flex gap-1">
                    {PRESET_DURS.map((d) => (
                      <button
                        key={d}
                        className="rounded border px-2 py-0.5 text-[12px]"
                        onClick={() => upsertVariant(d, 0)}
                        title={`${d} perc sor hozzáadása`}
                      >
                        + {d}p
                      </button>
                    ))}
                  </div>
                </div>

                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="text-left border-b" style={{ borderColor: "var(--color-line)" }}>
                      <th className="py-1 pr-2">Perc</th>
                      <th className="py-1 pr-2">Ár</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSvc.variants.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-2 text-[13px] text-[var(--color-muted)]">
                          Még nincs ár megadva ehhez a szolgáltatáshoz.
                        </td>
                      </tr>
                    ) : (
                      selectedSvc.variants.map((v) => (
                        <tr key={v.durationMin} className="border-b last:border-none" style={{ borderColor: "var(--color-line)" }}>
                          <td className="py-1 pr-2">{v.durationMin} p</td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              min={0}
                              value={v.priceHUF}
                              onChange={(e) =>
                                upsertVariant(
                                  v.durationMin,
                                  Number.parseInt(e.target.value || "0", 10)
                                )
                              }
                              className="w-[140px] rounded-md border px-2 py-1"
                              style={{ borderColor: "var(--color-line)" }}
                            />
                            <span className="ml-2 text-[12px] text-[var(--color-muted)]">
                              {v.priceHUF ? HUF(v.priceHUF) : ""}
                            </span>
                          </td>
                          <td className="py-1 text-right">
                            <button
                              className="rounded border px-2 py-0.5 text-[12px]"
                              onClick={() => delVariant(v.durationMin)}
                            >
                              Törlés
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mentés sáv */}
      <div className="mt-5 flex items-center gap-3">
        <button
          className="rounded-md border px-4 py-2 font-semibold"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Mentés…" : "Mentés"}
        </button>
        {msg && <div className="text-green-700 text-[14px]">{msg}</div>}
        {err && <div className="text-red-700 text-[14px]">{err}</div>}
      </div>
    </div>
  );
}
