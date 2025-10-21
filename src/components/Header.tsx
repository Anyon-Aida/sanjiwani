"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const NAV = [
  { href: "#services", label: "MASSAGES" },
  { href: "#about", label: "ABOUT US" },
  { href: "#offers", label: "OFFERS" },
  { href: "#staff", label: "OUR STAFF" },
  { href: "#contact", label: "CONTACT" },
];

const GOLD = "#CBA670";
const UNDERLINE = "#D7B780";
const DIVIDER = "var(--color-line)";

// kisebb nav, szélesebb header
const NAV_MAX_W = "860px";
const HEADER_MAX_W = "1400px";

export default function Header() {
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* HEADER – szélesebb, kifutóbb layout */}
      <div className="w-full text-white" style={{ backgroundColor: GOLD }}>
        <div
          className="mx-auto flex items-center justify-between gap-6 px-6 py-7 md:py-8 relative z-30"  // + relative z-30
          style={{ maxWidth: HEADER_MAX_W }}
        >
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/Sanjiwanihome.png"
              alt="Sanjiwani – The Cleansing Power of Massage"
              width={480}
              height={100}
              priority
              className="h-[100px] md:h-[100px] w-auto"
            />
          </Link>

          {/* DESKTOP contact sáv (≥1024px) */}
          <div className="hidden lg:flex items-center gap-8">
            <Contact icon={<PhoneIcon className="w-6 h-6 opacity-90" />} title="Phone number" value="+36 30 264 7176" />
            <TopDivider />
            <Contact icon={<AtIcon className="w-6 h-6 opacity-90" />} title="Email" value="info@sanjiwani.hu" link="mailto:info@sanjiwani.hu" />
            <TopDivider />
            <Contact icon={<ClockIcon className="w-6 h-6 opacity-90" />} title="Opening hours" value={<><strong>Sunday: 10–18</strong><br /> Monday - Saturday: 10–21</>} />
            <TopDivider />
            <span className="hidden md:inline-block rounded px-2 py-1 font-bold">HU</span>
          </div>

          {/* TABLET kompakt contact sáv (768–1023px) */}
          <div className="hidden md:flex lg:hidden items-center gap-4">
            <Contact icon={<PhoneIcon className="w-5 h-5 opacity-90" />} title="Phone" value="+36 30 264 7176" />
            <TopDivider />
            <Contact icon={<AtIcon className="w-5 h-5 opacity-90" />} title="Email" value="info@sanjiwani.hu" link="mailto:info@sanjiwani.hu" />
            <span className="ml-2 rounded px-2 py-1 font-bold">HU</span>
          </div>
          
          <div className="flex items-center gap-3">            
            <button
              className="md:hidden relative z-40 rounded-lg border border-white/30 px-3 py-2 text-white/90 cursor-pointer"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
      {/* NAV – keskenyebb, középen, belógatva */}
      <div className={`transition-transform ${compact ? "translate-y-0" : "translate-y-2"}`}>
        <div className="mx-auto w-full" style={{ maxWidth: HEADER_MAX_W }}>
          <div className="mx-auto" style={{ maxWidth: NAV_MAX_W }}>
            <div
              className={`relative z-10 bg-white shadow-spa ${
                compact ? "rounded-none" : "rounded-[24px]"
              } md:overflow-hidden overflow-visible`}   // <<— EZ A LÉNYEG
              style={{ borderColor: DIVIDER, marginTop: "-30px" }}
            >
              <nav className="hidden md:grid grid-cols-5">
                {NAV.map((item, i) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setActive(i)}
                    className={[
                      "relative flex items-center justify-center h-[64px] text-sm font-extrabold tracking-wide",
                      "transition-colors",
                      i === active ? "bg-[var(--color-bg)]" : "bg-white hover:bg-[var(--color-bg)]",
                    ].join(" ")}
                    style={{
                      borderLeft: i === 0 ? "none" : `1px solid ${DIVIDER}`,
                      borderBottom:
                        i === active ? `3px solid ${UNDERLINE}` : "3px solid transparent",
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {mobileOpen && (
                <div
                  className={`
                    md:hidden absolute inset-x-0 top-full z-40 bg-white border-b shadow-lg
                    origin-top transition-[opacity,transform] duration-300
                    ${mobileOpen ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"}
                  `}
                  style={{ borderColor: DIVIDER }}
                  role="menu"
                  aria-hidden={!mobileOpen}
                >
                  <div className="py-2">
                    {NAV.map((n, idx) => (
                      <a
                        key={n.href}
                        href={n.href}
                        onClick={() => {
                          setActive(idx);
                          setMobileOpen(false);
                        }}
                        className="block px-4 py-3 text-[15px] font-semibold tracking-wide
                                  hover:bg-[var(--color-bg)] transition-colors"
                        style={{ borderTop: idx === 0 ? "none" : `1px solid ${DIVIDER}` }}
                      >
                        {n.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ==== subcomponents ==== */
function Contact({ icon, title, value, link }: { icon: React.ReactNode; title: string; value: React.ReactNode; link?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      {icon}
      <div className="leading-tight">
        <div className="text-[12px] opacity-90">{title}</div>
        <div className="text-[16px] font-extrabold tracking-wide">{value}</div>
      </div>
    </div>
  );
  return link ? <a href={link} className="hover:opacity-90">{content}</a> : content;
}

function TopDivider() {
  return <div className="h-10 w-px bg-white/35" aria-hidden />;
}

/* ikonok */
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="1.8"
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9c1.5 2.6 3.6 4.7 6.2 6.2l.57-.27a2 2 0 0 1 2.12-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92Z"
      />
    </svg>
  );
}
function AtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="1.8" d="M16 8a4 4 0 1 0-4 4v1a2 2 0 1 0 4 0V8" />
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path strokeWidth="1.8" d="M12 6v6l4 2" />
    </svg>
  );
}
