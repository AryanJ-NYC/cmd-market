import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { BlogSection } from "./_components/landing/blog-section";
import { FinalCtaSection } from "./_components/landing/final-cta-section";
import { Footer } from "./_components/landing/footer";
import { HeroSection } from "./_components/landing/hero-section";
import { SkillSection } from "./_components/landing/skill-section";

export const metadata: Metadata = {
  description: "Sell through OpenClaw with less manual listing work and cleaner marketplace inventory.",
  title: "CMD Market"
};

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"]
});

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-stone-100">
      <HeroSection monoClassName={mono.className} />
      <SkillSection monoClassName={mono.className} />
      <BlogSection monoClassName={mono.className} />
      <FinalCtaSection monoClassName={mono.className} />
      <Footer monoClassName={mono.className} />
    </main>
  );
}
