import { create } from "zustand";
import { Socket } from "socket.io-client";

type State = {
  socket: Socket | null;
  sessionId: string | null;
  connected: boolean;
  sessionReady: boolean;       // NEW: UI can gate mic button on this
  transcripts: string[];
  aiFeedback: string | null;   // NEW: for analysis:question

  setSocket: (s: Socket) => void;
  setSessionId: (id: string) => void;
  addTranscript: (text: string) => void;
  setConnected: (v: boolean) => void;
  setSessionReady: (v: boolean) => void;  // NEW
  setAiFeedback: (text: string) => void;  // NEW
};

export const useVoiceStore = create<State>((set) => ({
  socket: null,
  sessionId: null,
  connected: false,
  sessionReady: false,
  transcripts: [],
  aiFeedback: null,

  setSocket: (socket) => set({ socket }),
  setSessionId: (sessionId) => set({ sessionId }),
  addTranscript: (text) =>
    set((state) => ({ transcripts: [...state.transcripts, text] })),
  setConnected: (connected) => set({ connected }),
  setSessionReady: (sessionReady) => set({ sessionReady }),  // NEW
  setAiFeedback: (aiFeedback) => set({ aiFeedback }),        // NEW
}));