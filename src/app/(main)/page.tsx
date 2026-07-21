import type { Metadata } from "next";

export const revalidate = 3600;
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ServicesPreview } from "@/components/sections/ServicesPreview";
import { WhyUs } from "@/components/sections/WhyUs";
import { ReviewsSlider } from "@/components/sections/ReviewsSlider";
import { BlogTeaser } from "@/components/sections/BlogTeaser";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { SafetyNotice } from "@/components/sections/SafetyNotice";
import { AppointmentNotice } from "@/components/sections/AppointmentNotice";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AppointmentNotice />
      <SafetyNotice />
      <HowItWorks />
      <ServicesPreview />
      <Reveal><WhyUs /></Reveal>
      <Reveal><ReviewsSlider /></Reveal>
      <Reveal><BlogTeaser /></Reveal>
      <Reveal><CtaBanner /></Reveal>
    </>
  );
}
