import Header from "@/components/Header";
import Footer from "@/components/Footer";
// A következőket majd fokozatosan hozzuk létre:
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Gallery from "@/components/Gallery";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";

const PICS = [
  { src: "/gallery/1.jpeg", alt: "Recepció" },
  { src: "/gallery/2.jpeg", alt: "Masszázsszoba" },
  { src: "/gallery/3.jpeg", alt: "Masszázságy" },
  { src: "/gallery/4.jpeg", alt: "Masszázságy" },
  { src: "/gallery/5.jpeg", alt: "Várakozó" },
  { src: "/gallery/6.jpeg", alt: "Kupon" },
  { src: "/gallery/7.jpg", alt: "Dekoráció" },
  { src: "/gallery/8.jpg", alt: "Kényesztetés" },
  { src: "/gallery/9.jpg", alt: "Dekoráció" },
  { src: "/gallery/10.jpg", alt: "Illóolajok" },
  { src: "/gallery/11.jpg", alt: "Dekoráció" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header />

      <main className="flex-1">
        {/* Hero section */}
        <Hero />

        {/* Szolgáltatások */}
        <Services />

        {/* Rólunk */}
        <About />

        {/* Vélemények */}
        <Reviews />

        {/* Galéria */}
        <Gallery pics={PICS} />

        {/* Gyakori kérdések */}
        <FAQ />

        {/* Kapcsolat */}
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
