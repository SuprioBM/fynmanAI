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

export default function QuickActions() {
  return (
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
  );
}