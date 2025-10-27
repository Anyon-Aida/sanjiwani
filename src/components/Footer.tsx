"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const leftLinks = [
    { href: "/impresszum", label: "Impresszum" },
    { href: "/adatkezeles", label: "Adatkezelés" },
    { href: "/sutik", label: "Sütik" },
  ];

  // ezek mehetnek a szekció-id-kre is (pl. #services)
  const rightLinks = [
    { href: "#services", label: "Szolgáltatások" },
    { href: "#prices", label: "Árak" },
    { href: "#about", label: "Rólunk" },
    { href: "#contact", label: "Kapcsolat" },
  ];

  const goTop = () =>
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  return (
    <footer className="relative mt-24 bg-[#caa46f] text-white">
      {/* kupola + logó */}
      <div
        className="
          pointer-events-none absolute -top-[110px] left-1/2 z-[1]
          h-[220px] w-[520px] -translate-x-1/2 rounded-b-full bg-[#caa46f]
          flex items-center justify-center
        "
      >
        <Image
          src="/Sanjiwanihome.png"         // <- tedd ide a fehér logód útvonalát
          alt="Sanjīwanī – The Cleansing Power of Massage"
          width={230}
          height={96}
          priority
        />
      </div>

      <div className="container-narrow mx-auto px-6 pt-[150px] pb-10 relative z-[2]">
        {/* felső két oszlop */}
        <div className="flex items-start justify-between gap-10">
          <ul className="space-y-2 text-[15px] leading-6 opacity-95">
            {leftLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="hover:opacity-80 transition-opacity"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="space-y-2 text-right text-[15px] leading-6 opacity-95">
            {rightLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="hover:opacity-80 transition-opacity"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* elválasztó vonal */}
        <hr className="my-6 border-white/60" />

        {/* alsó sor: copyright + top button */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] leading-5 opacity-90">
            © {new Date().getFullYear()} Sanjiwani. Minden jog fenntartva.
          </p>

          <button
            type="button"
            onClick={goTop}
            aria-label="Vissza a tetejére"
            className="
              group rounded bg-white/95 p-2.5 text-[#caa46f] shadow-sm
              hover:bg-white transition-colors
            "
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="block"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
