import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ServicesPreview } from "@/components/sections/ServicesPreview";
import { WhyUs } from "@/components/sections/WhyUs";
import { ReviewsSlider } from "@/components/sections/ReviewsSlider";
import { BlogTeaser } from "@/components/sections/BlogTeaser";
import { CtaBanner } from "@/components/sections/CtaBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <ServicesPreview />
      <WhyUs />
      <ReviewsSlider />
      <BlogTeaser />
      <CtaBanner />
    </>
  );
}
