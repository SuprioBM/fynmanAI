"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const aiAvatarUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAUIzVQ3oc__Xw0AYthf402PkhH_5wxRL8xVVRDcLofruubCrxqOLz2htEWhbCUyF4UjpQxHm943tw5iyEx1Bu768Qmv7K2L8yXu-HTIFnE1mOQLiWLr8tQVDko9AM1OzBVrf94Sc5VHku2a-2DcnXpcDyDC0Sd8SSUqMaJsiinwTkagoyMUSG0bhrlY5sWpm4OvS6XDeDdlDlJ3A2xCGvgQ8iQ-heiY7KY_wdGwawkN7D_PFzZBt4Av4nv2n9EFg0u1n_xpz6U5cR6";

const transcriptBlocks = [
  {
    tone: "muted",
    text: "To understand the core of the problem, we must first define the boundary of the system. What happens if we remove the primary assumption here?",
  },
  {
    tone: "normal",
    text: "If we remove the assumption of constant velocity, the energy balance shifts towards a dynamic state where acceleration becomes the primary driver of entropy.",
  },
  {
    tone: "muted",
    text: "Exactly. And how does that dynamic shift affect the local observer's perception of time?",
  },
];

type SessionState = "listening" | "thinking" | "speaking";

export default function ActiveSessionCenter() {
  const [sessionState, setSessionState] = useState<SessionState>("listening");
  const timerRef = useRef<number | null>(null);

  const statusLabel = useMemo(() => {
    if (sessionState === "thinking") return "Thinking";
    if (sessionState === "speaking") return "Speaking";
    return "Listening";
  }, [sessionState]);

  const statusDotClass = useMemo(() => {
    if (sessionState === "thinking") return "bg-tertiary animate-ping";
    if (sessionState === "speaking") return "bg-error animate-bounce";
    return "bg-primary animate-pulse";
  }, [sessionState]);

  const waveformOpacity =
    sessionState === "thinking" ? "opacity-30" : "opacity-100";

  const handleMicClick = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (sessionState === "listening") {
      setSessionState("thinking");
      timerRef.current = window.setTimeout(() => {
        setSessionState("speaking");
      }, 2000);
      return;
    }

    setSessionState("listening");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <section className="h-[calc(100%-3.5rem)] center-panel panel-transition flex-1 bg-background flex flex-col items-center px-8 relative">
      <div className="absolute top-2 flex items-center gap-4 py-1 px-4 rounded-full bg-surface-container-lowest border border-outline-variant">
        <div className={`w-2 h-2 rounded-full ${statusDotClass}`} />
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          {statusLabel}
        </span>
      </div>

      <div className="mt-32 flex flex-col items-center gap-8 w-full max-w-2xl">
        <div className="w-16 h-16 rounded-full bg-surface-container-high border border-primary/20 flex items-center justify-center overflow-hidden">
          <Image
            src={aiAvatarUrl}
            alt="FymenAI Logo"
            width={64}
            height={64}
            className="w-full h-full object-cover opacity-80 mix-blend-screen"
          />
        </div>
        <div
          className={`flex items-center justify-center gap-0.5 h-10 w-48 ${waveformOpacity}`}
        >
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`wave-${index}`}
              className={`waveform-bar w-0.75 bg-primary/${40 + index * 10} rounded-full`}
              style={{ animationDelay: `${(index * 0.2) % 0.6}s` }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mt-8 overflow-y-auto custom-scrollbar-transparent pb-32">
        <div className="space-y-6">
          {transcriptBlocks.map((block, index) => (
            <div
              key={`transcript-${index}`}
              className={
                block.tone === "muted"
                  ? "font-body-lg text-body-lg text-on-surface-variant leading-relaxed opacity-60"
                  : "font-body-lg text-body-lg text-on-surface leading-relaxed"
              }
            >
              {block.text}
            </div>
          ))}
          {sessionState === "thinking" && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className="w-1 h-1 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 w-full max-w-md flex justify-center lg:flex md:flex hidden">
        <div className="flex items-center gap-8 bg-surface-container-highest/50 backdrop-blur-md px-8 py-4 rounded-full border border-outline-variant">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            keyboard
          </button>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg active:scale-90 transition-transform"
            onClick={handleMicClick}
          >
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
            stop_circle
          </button>
        </div>
      </div>

    </section>
  );
}
