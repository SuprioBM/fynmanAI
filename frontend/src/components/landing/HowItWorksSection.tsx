const steps = [
  {
    icon: "upload_file",
    title: "01. UPLOAD",
    description: "Ingest PDFs, databases, and transcripts into your secure core.",
  },
  {
    icon: "settings_input_component",
    title: "02. CONFIGURE",
    description:
      "Define ontological boundaries and agent personas for specific tasks.",
  },
  {
    icon: "hub",
    title: "03. AI MAPS",
    description:
      "Neural engines identify connections and hidden patterns in real-time.",
  },
  {
    icon: "layers",
    title: "04. KNOWLEDGE COMPOUNDS",
    description:
      "Insights bridge across sessions, compounding into permanent wisdom.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-[#0f0d15] border-y border-[#464554]/10">
      <div className="px-4 md:px-12 max-w-360 mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-display-lg text-display-lg mb-4">
            Architecting Logic
          </h2>
          <p className="font-body-lg text-body-lg text-[#c7c4d7]">
            Four stages to intellectual transcendence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-linear-to-r from-transparent via-[#464554]/30 to-transparent" />
          {steps.map((step) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#2b2832] border border-white/10 flex items-center justify-center mb-6 z-10">
                <span className="material-symbols-outlined text-[#c0c1ff]">
                  {step.icon}
                </span>
              </div>
              <h4 className="font-label-mono text-label-mono text-[#c0c1ff] mb-2">
                {step.title}
              </h4>
              <p className="font-body-sm text-body-sm text-[#c7c4d7] px-4">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
