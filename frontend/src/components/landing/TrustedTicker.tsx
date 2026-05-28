const tickerItems = [
  "QUANTUM-CORE",
  "SYNTHESIS LABS",
  "VERTEX RESEARCH",
  "NEURAL ARCHIVE",
  "AXIOM DATA",
  "QUANTUM-CORE",
  "SYNTHESIS LABS",
  "VERTEX RESEARCH",
];

export default function TrustedTicker() {
  return (
    <div className="w-full mt-24 overflow-hidden py-8 border-y border-[#464554]/10 bg-[#0f0d15]/50">
      <div className="ticker-scroll flex items-center whitespace-nowrap gap-12 md:gap-24 opacity-40 grayscale">
        {tickerItems.map((item, index) => (
          <span key={`${item}-${index}`} className="font-headline-md text-headline-md">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
