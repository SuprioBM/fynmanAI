import Image from "next/image";

const profileImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuApIvNFMJXHCg8P4tpG5QDsfymtv-urWSYBmXDYrNt9JRKsYzVCASmmYLijjs7p5tsT_r72DIv-dfvV9jy7r5-jyTvcH8jMGmAkBtOjB8JinodWzKr6jkTm_cVbxPCfco3eCxPSm2SBtD9-VWB-yGRSecULyws75JmL9YZAkCFMlSgCRceb5J2ojTsF0u6FY5_EI7SGKq-wJhUVIs0JKetZHC1PHt7YZZu6LOB88CQMWpbrPqyZutKn2TggFRTQ8yBriIB5_ltIzdYl";

const avatarUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDx58UFf8Zkf4ThtO7ufT7-KQgBt-LCoSLduSZ6amC-zKnDnVdU9gjeq5UKGRFlh3HFR54soCyjtrs_xhIGNCWYZn77RB1JOSoKDZnROBJlGClfJs2YK5VbhKifwX_JnTidJUkQHzIA7bCd7O4Ic08Bfetzmk5Ts42fritLV2M8UTBbFVcGhXtjB6HKdIxVL48QMJzpQA93WERCEEU0RMepIGJeQyFdEjzat374OgO2x-Sq6558duwc4PloptIjzmzjYNCCPs4z1pMj";

const depthModes = [
  { title: "Casual", subtitle: "Brief & Direct", active: false },
  { title: "Deep", subtitle: "Analytical Rooting", active: true },
  { title: "Exam", subtitle: "Knowledge Audit", active: false },
  { title: "Challenge", subtitle: "Strict Dialectic", active: false },
];

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar-settings p-8 bg-surface">
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
            <section className="space-y-6" id="profile">
              <div className="pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Profile
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Manage your public identity and core account details.
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="relative">
                  <Image
                    src={profileImageUrl}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full border-2 border-outline-variant"
                  />
                  <button className="absolute bottom-0 right-0 bg-primary p-1 rounded-full border-2 border-background">
                    <span className="material-symbols-outlined text-[16px] text-on-primary">
                      edit
                    </span>
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-label-sm uppercase tracking-wider text-outline">
                        Full Name
                      </label>
                      <input
                        className="w-full bg-surface-container border border-outline-variant rounded px-4 py-2 focus:border-primary focus:outline-none transition-all"
                        type="text"
                        value="Alexander Thorne"
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-sm uppercase tracking-wider text-outline">
                        Email Address
                      </label>
                      <input
                        className="w-full bg-surface-container border border-outline-variant rounded px-4 py-2 focus:border-primary focus:outline-none transition-all"
                        type="email"
                        value="a.thorne@fymen.ai"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-6" id="cognitive">
              <div className="pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Cognitive Preferences
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Calibrate how the AI interacts with your mental workflow.
                </p>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-label-sm uppercase tracking-wider text-outline">
                    Default Depth Mode
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {depthModes.map((mode) => (
                      <button
                        key={mode.title}
                        className={
                          mode.active
                            ? "p-4 rounded border border-primary bg-primary/5 text-center"
                            : "p-4 rounded border border-outline-variant hover:border-primary transition-all text-center group"
                        }
                      >
                        <p
                          className={
                            mode.active
                              ? "font-bold text-primary"
                              : "font-bold text-on-surface"
                          }
                        >
                          {mode.title}
                        </p>
                        <p
                          className={
                            mode.active
                              ? "text-xs text-primary/70"
                              : "text-xs text-outline group-hover:text-on-surface-variant"
                          }
                        >
                          {mode.subtitle}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-label-sm uppercase tracking-wider text-outline">
                    Preferred AI Personality
                  </label>
                  <select className="w-full bg-surface-container border border-outline-variant rounded px-4 py-4 appearance-none focus:border-primary focus:outline-none transition-all">
                    <option>Soft Socratic - Guiding through questions</option>
                    <option>Challenger - Pressure-testing logic</option>
                    <option>Analytical Peer - Collaborative data synthesis</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-6" id="system">
              <div className="pb-4 border-b border-outline-variant">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  System
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Application-wide interface and behavior settings.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
                  <div>
                    <p className="font-medium text-on-surface">Dark Mode</p>
                    <p className="text-xs text-outline">
                      Optimized for low-light focus
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
                  <div>
                    <p className="font-medium text-on-surface">
                      Focus Notifications
                    </p>
                    <p className="text-xs text-outline">
                      Mute all during active sessions
                    </p>
                  </div>
                  <div className="w-12 h-6 bg-outline-variant rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-full" />
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-6 flex justify-end gap-4">
              <button className="px-6 py-4 text-on-surface-variant font-label-md hover:bg-surface-container-high rounded-lg transition-colors">
                Discard Changes
              </button>
              <button className="px-8 py-4 bg-primary text-on-primary font-bold rounded-lg transition-all hover:brightness-110">
                Save All Changes
              </button>
            </div>
      </div>
    </div>
  );
}
