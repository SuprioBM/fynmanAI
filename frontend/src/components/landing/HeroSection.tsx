import TrustedTicker from "./TrustedTicker";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-12 overflow-hidden">
        {/* Background Images Wrapper */}
        <div className="absolute inset-0">
          {/* Desktop Background */}
          <Image
            src="/fymen-herobg.png"
            alt="Hero Background Desktop"
            fill
            priority
            className="hidden md:block object-cover"
          />

          {/* Mobile Background */}
          <Image
            src="/fymen-herobgm.png"
            alt="Hero Background Mobile"
            fill
            priority
            className="block md:hidden object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-[#12131b]/80" />

          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c0c1ff]/10 blur-[120px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 pt-10">
          <span className="font-label-mono text-label-mono text-[10px] md:text-base uppercase tracking-[0.2em] text-[#c0c1ff] mb-6 block">
            ↳ Cognitive Infrastructure, Redefined
          </span>

           <h1 className="font-display-lg text-[2rem] leading-tight md:text-[84px] md:leading-none mb-8 max-w-5xl">
              You don&apos;t just learn.
            <br />
            <span className="violet-gradient-text">
              You architect understanding.
            </span>
          </h1>

        <p className="font-body-lg text-body-lg text-[#c7c4d7] max-w-2xl mx-auto mb-10 text-center">
          Transcend static documentation. Experience adaptive AI sessions powered by
          a living knowledge graph that grows with every interaction.
        </p>

      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <Link
          href="/session"
          className="bg-[#c0c1ff] text-[#1000a9] font-body-md px-8 py-4 rounded-lg font-bold hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2 w-full md:w-auto"
        >
          Start Thinking
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>

        <button className="bg-white/5 border border-white/10 font-body-md px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-colors w-full md:w-auto">
          See it work
        </button>
      </div>
        </div>
      <TrustedTicker />
      </section>

  );
}