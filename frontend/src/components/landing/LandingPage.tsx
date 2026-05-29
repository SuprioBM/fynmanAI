import BentoSection from "./BentoSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import SiteFooter from "./SiteFooter";
import TopNav from "./TopNav";

export default function LandingPage() {
  return (
    <div className="bg-[#15121b] text-[#e7e0ed] min-h-screen overflow-x-hidden selection:bg-[#8083ff] selection:text-[#0d0096]">
      <TopNav />
      <main className="pt-14">
        <HeroSection />
        <BentoSection />
        <HowItWorksSection />
        <SiteFooter />
      </main>
    </div>
  );
}
