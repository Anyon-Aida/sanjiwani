import Image from "next/image";

export default function Hero() {
  return (
    <section className="pt-16 md:pt-24 lg:pt-28 pb-12 md:pb-14">
      {/* a header szélességéhez igazítjuk */}
      <div className="mx-auto px-6" style={{ maxWidth: "1120px" }}>
        {/* Felső rács */}
        <div className="grid gap-10 grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Bal: tartalom */}
          <div className="max-w-[640px]">
            <div
              className="inline-flex items-center rounded-full px-4 py-1.5 text-sm border bg-white"
              style={{ borderColor: "var(--color-line)" }}
            >
              Eredeti thai & balinéz technikák
            </div>

            <h1 className="mt-4 font-heading text-[56px] leading-[1.06] md:text-[48px] sm:text-[36px]">
              Nyugalom és
              <br /> megújulás
              <br /> a Sanjiwaniban
            </h1>

            <p className="mt-4 text-[17px] leading-7 text-[var(--color-muted)]">
              Kíméletes, mégis hatékony masszázsaink segítenek lelassulni és
              visszanyerni a testi–lelki egyensúlyt. Csendes, tiszta környezet –
              személyre szabott figyelemmel.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#services"
                className="inline-flex items-center rounded-full px-5 py-3 font-bold text-white shadow-spa"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Időpontot foglalok
              </a>
              <a
                href="#services"
                className="inline-flex items-center rounded-full px-5 py-3 font-bold"
                style={{
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-primary)",
                  background: "transparent",
                }}
              >
                Szolgáltatások
              </a>
            </div>
          </div>

          {/* Jobb: kép – KÁRTYA, nem teljes szélességű */}
          <div className="justify-self-end lg:justify-self-stretch w-full">
            <div
    className="
      relative overflow-hidden rounded-2xl border shadow-spa
      w-full md:w-[520px]
      aspect-[6/3] sm:aspect-[5/4] md:aspect-[4/3]
    "
    style={{ borderColor: "var(--color-line)" }}
            >
              <Image
                src="/massage/traditionelle-thai-massage.png"  // tedd ide a képed
                alt="Relaxáló olajos masszázs"
                width={1040}
                height={720}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Alsó feature-kártyák – kompakt, Figma-ritmus */}
        <div className="mt-10 grid gap-6 grid-cols-1 md:grid-cols-3">
          <Feature
            title="Eredeti technikák"
            text="Tradicionális thai és balinéz módszerek, gyakorlott terapeutákkal."
          />
          <Feature
            title="Tiszta, csendes környezet"
            text="Steril higiénia, friss textíliák, halk zene – maximális komfort."
          />
          <Feature
            title="Könnyű megközelítés"
            text="Központi elhelyezkedés, jó parkolási lehetőségek."
          />
        </div>
      </div>
    </section>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="bg-white border rounded-xl px-5 py-4 shadow-spa"
      style={{ borderColor: "var(--color-line)" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-grid place-items-center w-8 h-8 rounded-full shrink-0"
          style={{ background: "#EEDFC2", color: "#7A5C45" }}
          aria-hidden
        >
          ✓
        </span>
        <div>
          <div className="font-semibold mb-1">{title}</div>
          <p className="text-[15px] leading-[1.6] text-[var(--color-muted)]">{text}</p>
        </div>
      </div>
    </div>
  );
}
