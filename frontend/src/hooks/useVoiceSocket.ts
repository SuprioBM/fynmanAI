import { createSocket } from "@/lib/socket/socket";
import { startSession } from "@/services/voice.service";
import { useVoiceStore } from "@/store/useVoiceStore";

export const useVoiceSocket = (token: string) => {
  const {
    setSocket,
    setSessionId,
    addTranscript,
    setConnected,
    setSessionReady,   // NEW
    setAiFeedback,     // NEW
  } = useVoiceStore();

  const startSessionFlow = async (socket: any) => {
    setSessionReady(false); // block mic while pending — fixes race condition
    try {
      const session: any = await startSession(socket);
      setSessionId(session.id);
      setSessionReady(true); // now safe to record
    } catch (err) {
      console.error("Session start failed:", err);
      setSessionReady(false);
    }
  };

  const connect = () => {
    const socket = createSocket(token);
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      startSessionFlow(socket); // fixes gap #1 + reconnect recovery
    });

    // "connect" fires again automatically on reconnect,
    // so startSessionFlow re-runs — fixes reconnect gap

    socket.on("disconnect", () => {
      setConnected(false);
      setSessionReady(false); // block mic on disconnect
    });

    socket.on("transcript:chunk", (data) => {
      addTranscript(data.chunk.text);
    });

    socket.on("analysis:question", (data) => {
      setAiFeedback(data.question ?? data.text ?? JSON.stringify(data)); // fixes gap #2
    });

    return socket;
  };

  return { connect };
};