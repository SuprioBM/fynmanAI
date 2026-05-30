const navLinks = ["Platform", "Research", "Pricing", "Docs"];
const supportLinks = ["Status", "Terms", "Privacy"];
const socialIcons = ["terminal", "alternate_email", "share"];

export default function SiteFooter() {
  return (
    <footer className="py-24 px-4 md:px-12 border-t border-[#464554]/10">
      <div className="max-w-360 mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        <div>
          <span className="font-headline-md text-headline-md font-bold tracking-tighter mb-6 block">
            FymenAI
          </span>
          <p className="font-body-sm text-body-sm text-[#c7c4d7] mb-8 max-w-xs">
            The elite intelligence layer for modern researchers and architects of
            information. Built for privacy, speed, and cognitive clarity.
          </p>
          <p className="font-label-mono text-[10px] text-[#908fa0] opacity-50">
            © 2024 FYMENAI SYSTEMS. ALL RIGHTS RESERVED.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h5 className="font-label-mono text-label-mono text-[#c0c1ff] uppercase mb-6">
              Navigation
            </h5>
            <ul className="space-y-4 font-body-sm text-body-sm text-[#c7c4d7]">
              {navLinks.map((link) => (
                <li key={link}>
                  <a className="hover:text-[#c0c1ff] transition-colors" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-label-mono text-label-mono text-[#c0c1ff] uppercase mb-6">
              Support
            </h5>
            <ul className="space-y-4 font-body-sm text-body-sm text-[#c7c4d7]">
              {supportLinks.map((link) => (
                <li key={link}>
                  <a className="hover:text-[#c0c1ff] transition-colors" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h5 className="font-label-mono text-label-mono text-[#c0c1ff] uppercase mb-6">
            Socials
          </h5>
          <div className="flex gap-4">
            {socialIcons.map((icon) => (
              <a
                key={icon}
                className="w-10 h-10 etched-border flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {icon}
                </span>
              </a>
            ))}
          </div>
          <div className="mt-8 p-4 etched-border bg-[#1d1a23] rounded-lg">
            <p className="font-label-mono text-[11px] text-[#c7c4d7] mb-2">
              STABILITY INDEX
            </p>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[99.9%] bg-[#c0c1ff]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
