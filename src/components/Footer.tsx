"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const leftLinks = [
    { href: "/impresszum", label: "Impresszum" },
    { href: "/adatkezeles", label: "Adatkezelés" },
    { href: "/sutik", label: "Sütik" },
  ];

  const rightLinks = [
    { href: "#services", label: "Szolgáltatások" },
    { href: "#prices", label: "Árak" },
    { href: "#about", label: "Rólunk" },
    { href: "#contact", label: "Kapcsolat" },
  ];

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative z-20 mt-24 bg-[#caa46f] text-white overflow-visible">
      {/* felfelé ívelt kupola */}
    <div aria-hidden="true"
        className="pointer-events-none absolute -top-[100px] left-1/2 z-[1]
                    h-[220px] w-[520px] -translate-x-1/2
                    bg-[#caa46f]
                    [clip-path:ellipse(260px_220px_at_50%_100%)]
                    flex items-center justify-center">
        <Image src="/Sanjiwanihome.png" alt="Sanjīwanī – The Cleansing Power of Massage"
                width={230} height={96} priority />
    </div>

      {/* belső tartalom */}
      <div className="mx-auto max-w-[1120px] px-6 pt-32 md:pt-40 pb-10 relative z-[2]">
        <div className="grid grid-cols-2 gap-10 items-start">
          <ul className="space-y-2 text-[15px] leading-6 opacity-95">
            {leftLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-opacity hover:opacity-80"
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
                  className="transition-opacity hover:opacity-80"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <hr className="mt-8 mb-6 border-t border-white/55" />

        <div className="flex items-center justify-between">
          <p className="text-[13px] leading-5 opacity-90">
            © {new Date().getFullYear()} Sanjiwani. Minden jog fenntartva.
          </p>

          <button
            type="button"
            onClick={goTop}
            aria-label="Vissza a tetejére"
            className="rounded-md p-2.5 bg-[#fffaf4] text-[#caa46f] shadow-sm hover:bg-white transition-colors"
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
