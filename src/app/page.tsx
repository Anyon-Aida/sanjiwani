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
        <Gallery />

        {/* Gyakori kérdések */}
        <FAQ />

        {/* Kapcsolat */}
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
