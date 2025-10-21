import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-12 md:py-16">
      <div className="mx-auto px-6" style={{ maxWidth: "1120px" }}>
        {/* mobil: 1 oszlop, md+: 2 oszlop (szöveg | kép) */}
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-10 items-center">
          {/* szöveg – mobilon felül */}
          <div>
            <h2 className="font-heading text-[36px] md:text-[32px] leading-tight mb-3">Rólunk</h2>

            <p className="text-[16px] leading-7 text-[var(--color-foreground)]/80 mb-4 max-w-[60ch]">
              Célunk, hogy egy olyan menedéket nyújtsunk, ahol a nyugalom és a
              test–lélek harmóniája találkozik. Terapeutáink tradicionális
              képzésben részesültek, így minden kezelés valódi, eredeti
              technikákon alapul.
            </p>

            <ul className="list-disc pl-5 space-y-2 text-[16px]">
              <li>Képzett, tapasztalt terapeuták</li>
              <li>Diszkrét, higiénikus környezet</li>
              <li>Személyre szabott figyelem</li>
            </ul>

            <div className="mt-6">
              <a
                href="#booking"
                className="inline-flex items-center rounded-full px-5 py-3 font-bold text-white shadow-spa"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Foglalás
              </a>
            </div>
          </div>

          {/* kép – mobilon alul, md+ jobbra */}
          <div className="justify-self-end md:justify-self-stretch">
            <div
              className="overflow-hidden rounded-2xl border shadow-spa bg-white w-full"
              style={{ borderColor: "var(--color-line)", maxWidth: 520 }}
            >
              <Image
                src="/about/about-hero.png"
                alt="Sanjíwani belső tér és eszközök"
                width={1040}
                height={680}
                className="w-full h-[260px] md:h-[280px] object-cover"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
