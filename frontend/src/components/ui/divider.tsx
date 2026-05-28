export function Divider({ label = "Or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="h-px flex-1 bg-outline-variant opacity-30" />
      <span className="text-[10px] text-label-sm uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <div className="h-px flex-1 bg-outline-variant opacity-30" />
    </div>
  );
}
