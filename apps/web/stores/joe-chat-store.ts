import { create } from "zustand";

export type JoePose = "idle" | "talking";

type ChatStatus = "idle" | "streaming" | "error";

type JoeChatState = {
  input: string;
  lastPrompt: string;
  responseText: string;
  status: ChatStatus;
  error: string | null;
  setInput: (input: string) => void;
  submitPrompt: () => Promise<void>;
};

export const selectJoePose = (state: JoeChatState): JoePose =>
  state.status === "streaming" ? "talking" : "idle";

export const useJoeChatStore = create<JoeChatState>((set, get) => ({
  input: "",
  lastPrompt: "",
  responseText: "",
  status: "idle",
  error: null,
  setInput: (input) => set({ input }),
  submitPrompt: async () => {
    const prompt = get().input.trim();

    if (!prompt || get().status === "streaming") {
      return;
    }

    set({
      input: "",
      lastPrompt: prompt,
      responseText: "",
      status: "streaming",
      error: null
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          const remainingText = decoder.decode();

          if (remainingText) {
            set((state) => ({ responseText: state.responseText + remainingText }));
          }

          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        set((state) => ({ responseText: state.responseText + chunk }));
      }

      set({ status: "idle" });
    } catch {
      set({
        status: "error",
        error: "Er ging iets mis tijdens het streamen. Probeer opnieuw."
      });
    }
  }
}));
