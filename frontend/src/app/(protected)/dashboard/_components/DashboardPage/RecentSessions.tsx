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

export default function RecentSessions() {
  return (
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
  );
}