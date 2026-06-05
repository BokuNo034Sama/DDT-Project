import fs from "fs";
import path from "path";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function MarketingLandingPage() {
  let hasHeroVisual = false;
  try {
    hasHeroVisual = fs.existsSync(
      path.join(process.cwd(), "public", "images", "hero_visual.png")
    );
  } catch {
    // Fallback
  }

  return (
    <>
      <HeroSection hasHeroVisual={hasHeroVisual} />
      <ProblemSection />
      <FeaturesSection />
      <PricingSection />
    </>
  );
}
