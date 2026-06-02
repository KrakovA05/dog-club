import { HeroSection } from "@/components/sections/HeroSection";
import { ServicesPreview } from "@/components/sections/ServicesPreview";
import { WhyUs } from "@/components/sections/WhyUs";
import { StatsSection } from "@/components/sections/StatsSection";
import { ReviewsSlider } from "@/components/sections/ReviewsSlider";
import { CtaBanner } from "@/components/sections/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesPreview />
      <WhyUs />
      <StatsSection />
      <ReviewsSlider />
      <CtaBanner />
    </>
  );
}
