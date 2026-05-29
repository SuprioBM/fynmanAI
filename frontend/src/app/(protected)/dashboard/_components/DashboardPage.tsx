import Image from "next/image";

const sessions = [
  {
    category: "Theoretical Physics",
    title: "Quantum Field Topology",
    lastActive: "Last active 2h ago",
  },
  {
    category: "AI Ethics",
    title: "Heuristic Bias Mapping",
    lastActive: "Last active 5h ago",
  },
];

const quickActions = [
  {
    icon: "upload_file",
    title: "Upload Data",
    description: "PDF, Text, or Voice notes.",
    tone: "text-primary",
  },
  {
    icon: "bookmarks",
    title: "Bookmarks",
    description: "12 saved causal nodes.",
    tone: "text-tertiary",
  },
  {
    icon: "history",
    title: "Recent Logs",
    description: "Review 24hr activity.",
    tone: "text-on-secondary-container",
  },
];

const suggestedActions = [
  "Re-evaluate Node 42 causal bridge",
  "Synthesize ethics report for Thread B",
  "Update knowledge base from latest upload",
];


const networkImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWThB59D_DBVFFEmz1ueL-At9mj1RpSmolTKtygoNDNAlv_ldEeUD_lp2NGBPVFsGfJ1wneF65WVKqUXS4RJwZn2RsdpRoKGmdie97gzPTFXbddQF3Eak59YwdnBbzC1yY1bvYYsdICqH_7z7xtT2FLw0oGOTsbC-1asQYTzTty0kOzSF5j3f0LglqiS3w_kjNMkj1FAAKbCiDpxNb_rhJpKtVZX7RB0Pb6mGaE7vI3_EQilqSkx1recfjE8EXMBctYdZdnRBcDMMk";

export default function DashboardPage() {
  return (
    <div className="h-[calc(100%-3.5rem)]">
      <div className="bg-[#0b1220] overflow-y-auto custom-scrollbar lg:mr-80 h-full">
        <div className="p-6 flex flex-col gap-8 max-w-5xl mx-auto w-full">
          <section className="flex flex-col gap-2 py-8 inner-divider">
            <h1 className="font-display text-display text-on-surface">
              Welcome Back, Investigator.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Your cognitive system has processed 4 active threads since your
              last session. Causal links in "Neural Architecture" require
              immediate validation.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Recent Sessions
              </h2>
              <button className="text-primary font-label-md text-label-md hover:underline">
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.title}
                  className="bg-[#111827] border border-[#273244] p-4 flex flex-col gap-4 hover:border-[#4f6bff] transition-all cursor-pointer group hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary uppercase tracking-tighter mb-1">
                        {session.category}
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        {session.title}
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      more_vert
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                      schedule
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {session.lastActive}
                    </span>
                  </div>
                  <button className="w-full bg-[#1a2232] border border-[#273244] py-2 text-on-surface font-label-md text-label-md group-hover:bg-[#4f6bff] group-hover:border-transparent transition-all">
                    Resume Session
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.title}
                className="bg-[#0e1626] border border-[#273244] p-4 flex flex-col gap-2 hover:bg-[#111827] transition-all cursor-pointer"
              >
                <span className={`material-symbols-outlined ${action.tone}`}>
                  {action.icon}
                </span>
                <h4 className="font-headline-md text-headline-md text-on-surface">
                  {action.title}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {action.description}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-80 bg-surface-container-low border-l border-outline-variant flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
            Session Intelligence
          </span>
          <div className="p-4 bg-[#111827] border border-[#273244] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Logical Consistency
              </span>
              <span className="font-label-md text-label-md text-primary">94%</span>
            </div>
            <div className="w-full h-1 bg-[#1f2a3a]">
              <div className="h-full bg-primary" style={{ width: "94%" }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
            Network Visualization
          </span>
          <div className="aspect-square w-full bg-[#111827] border border-[#273244] relative overflow-hidden">
            <Image
              src={networkImageUrl}
              alt="Data visualization"
              fill
              sizes="(min-width: 1024px) 320px, 0px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#111827] to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-tertiary-container uppercase tracking-widest font-bold">
            Suggested Actions
          </span>
          <div className="flex flex-col gap-1">
            {suggestedActions.map((action) => (
              <div
                key={action}
                className="p-2 text-on-surface-variant font-body-md text-body-md hover:text-on-surface cursor-pointer border-l border-transparent hover:border-primary pl-4 transition-all"
              >
                • {action}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 bg-[#1a2232] border border-[#4f6bff] rounded-lg">
          <p className="font-label-sm text-label-sm text-on-surface italic">
            "The clarity of your logic determines the strength of the system."
          </p>
          <div className="mt-2 text-[10px] text-primary uppercase font-bold">
            — System Core
          </div>
        </div>
      </aside>
    </div>
  );
}
