import Image from "next/image";

const graphImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCuuIpt7GTqrEm-r0_JsGRGIxDdCfYUbSPINUTT2GWEBtDb8bPam1ODLEDTOemmgv44be8_0jgjavYHP1_yP89jcm_Up5rwJ_CflvoaEKJgJwu406zBgU2oIGahtVv_qY49IW18DzT4pgokuUbAsjNCMPVynVuTgD5x5Q4y5Vcuc0qPiAf0O07wcrUD15a4Z12JWG2Mhru9OAYiT5qFTwAD-5ZcnHDyBSBhSnn6TQiSmDFDmw8s7gy2SbBXMQ4tpBzM2irbl6VDCzs";

const labImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCThS66-Irr3gokd1z4J5Llhj8ovO2a5YGLJllQBHPgbzsk2MVPJwHa9781tOG4FnJ0zYTJ_k7iFqfIQaSBMkPggEzpc_2wI_73y55yNILy5iPdQcUSw5L6kpVaq0GZmP94X01mASFEljXHxg-cBdNOR0BgFppTP9M_95f77GoG2WG5XoT2xrTCXkgN7gRI_bTCrbTAkI4RI06eQkjmCM7gs1w6XLDhaBVa0iVj7ofiRZORz2iIcA7Pz9LLz7114ydSwO49iCQ7nMo";

export default function BentoSection() {
  return (
    <section className="py-24 px-4 md:px-12 max-w-360 mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full md:h-175">
        <div className="md:col-span-8 etched-border bg-[#211e27] rounded-xl p-10 flex flex-col justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#c0c1ff] mb-4">
              <span className="material-symbols-outlined">account_tree</span>
              <span className="font-label-mono text-label-mono uppercase">
                Neural Persistence
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-3xl mb-4">
              Graph Memory
            </h3>
            <p className="font-body-md text-body-md text-[#c7c4d7] max-w-md">
              Every session maps new data points to your existing knowledge base,
              creating an ever-evolving map of your intellectual domain.
            </p>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] w-2/3 h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-700">
            <Image
              src={graphImage}
              alt="Abstract neural network visualization"
              fill
              sizes="(min-width: 768px) 420px, 240px"
              className="object-cover rounded-full"
            />
          </div>
        </div>

        <div className="md:col-span-4 etched-border bg-[#2b2832] rounded-xl p-10 flex flex-col group">
          <div className="flex items-center gap-2 text-[#f3aeff] mb-4">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="font-label-mono text-label-mono uppercase">
              Context Engine
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md text-2xl mb-4">
            Session Intelligence
          </h3>
          <p className="font-body-sm text-body-sm text-[#c7c4d7] mb-8">
            AI agents that don&apos;t just answer; they analyze context from your
            entire archive to provide surgical precision in every response.
          </p>
          <div className="mt-auto h-32 w-full bg-[#15121b] rounded-lg border border-white/5 p-4 overflow-hidden">
            <div className="h-2 w-2/3 bg-[#c0c1ff]/20 rounded mb-2" />
            <div className="h-2 w-full bg-white/5 rounded mb-2" />
            <div className="h-2 w-1/2 bg-white/5 rounded" />
          </div>
        </div>

        <div className="md:col-span-12 etched-border bg-[#13103A] rounded-xl p-10 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[#cebdff] mb-4">
              <span className="material-symbols-outlined">biotech</span>
              <span className="font-label-mono text-label-mono uppercase">
                Deep Discovery
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-3xl mb-4">
              Deep Research Mode
            </h3>
            <p className="font-body-md text-body-md text-[#c7c4d7] max-w-xl">
              Deploy multi-agent swarms to synthesize thousands of pages across
              your vault into cohesive whitepapers, reports, and strategic
              insights.
            </p>
            <div className="mt-8 flex gap-4">
              <span className="font-label-mono text-[10px] border border-white/10 px-2 py-1 rounded bg-white/5">
                LATENCY: 12ms
              </span>
              <span className="font-label-mono text-[10px] border border-white/10 px-2 py-1 rounded bg-white/5">
                AGENTS: 24 ACTIVE
              </span>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-[#0f0d15] rounded-lg border border-white/5 relative overflow-hidden group">
            <Image
              src={labImage}
              alt="Futuristic laboratory interface"
              fill
              sizes="(min-width: 768px) 320px, 100vw"
              className="object-cover mix-blend-screen opacity-60 group-hover:scale-110 transition-transform duration-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
