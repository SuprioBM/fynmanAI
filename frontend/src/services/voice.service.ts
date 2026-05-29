import type { Socket } from "socket.io-client";

type SessionStartPayload = {
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
};

type SessionStartResponse = {
  ok?: boolean;
  session?: {
    id: string;
  };
  error?: string;
};

type SocketAck = {
  ok?: boolean;
  error?: string;
};

export const startSession = (
  socket: Socket,
  payload: SessionStartPayload = {}
) =>
  new Promise<{ id: string }>((resolve, reject) => {
    socket.emit("session:start", payload, (res: SessionStartResponse) => {
      if (res.ok && res.session) {
        resolve(res.session);
        return;
      }

      reject(res.error || "Failed to start session");
    });
  });

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

type AudioChunkOptions = {
  fileName?: string;
  mimeType?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  endMessage?: string;
};

export const sendAudioChunk = async (
  socket: Socket,
  sessionId: string,
  blob: Blob,
  options: AudioChunkOptions = {}
) => {
  const base64 = await blobToBase64(blob);

  return new Promise<void>((resolve, reject) => {
    socket.emit("audio:chunk", {
      sessionId,
      audioBase64: base64,
      fileName: options.fileName || `chunk-${Date.now()}.webm`,
      mimeType: options.mimeType || blob.type || "audio/webm",
      startTimeMs: options.startTimeMs,
      endTimeMs: options.endTimeMs,
      endMessage: options.endMessage,
    }, (res: SocketAck) => {
      if (res?.ok) {
        resolve();
        return;
      }

      reject(new Error(res?.error || "Failed to send audio chunk"));
    });
  });
};

export const sendTextInput = (
  socket: Socket,
  sessionId: string,
  text: string
) => {
  socket.emit("text:input", {
    sessionId,
    text,
  });
};

export const endUserSession = (socket: Socket, sessionId: string) =>
  new Promise<void>((resolve, reject) => {
    socket.emit("user:end", { sessionId }, (res: SocketAck) => {
      if (res?.ok) {
        resolve();
        return;
      }

      reject(new Error(res?.error || "Failed to end user session"));
    });
  });
