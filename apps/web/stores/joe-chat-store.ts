import { create } from "zustand";
import { buildDialogueView } from "@/lib/dialogue-chunks";

export type JoePose = "idle" | "talking";

type ChatStatus = "idle" | "streaming" | "error";

type JoeChatState = {
  input: string;
  lastPrompt: string;
  responseText: string;
  dialogueIndex: number;
  status: ChatStatus;
  error: string | null;
  setInput: (input: string) => void;
  advanceDialogue: () => void;
  submitPrompt: () => Promise<void>;
};

export const selectJoePose = (state: JoeChatState): JoePose => {
  if (state.status === "streaming") {
    return "talking";
  }

  if (!state.responseText.trim()) {
    return "idle";
  }

  const dialogue = buildDialogueView(state.responseText, state.dialogueIndex, 2);

  if (dialogue.canAdvance) {
    return "talking";
  }

  return "idle";
};

export const useJoeChatStore = create<JoeChatState>((set, get) => ({
  input: "",
  lastPrompt: "",
  responseText: "",
  dialogueIndex: 0,
  status: "idle",
  error: null,
  setInput: (input) => set({ input }),
  advanceDialogue: () => {
    const { responseText, dialogueIndex } = get();
    const dialogue = buildDialogueView(responseText, dialogueIndex, 2);

    if (dialogue.canAdvance) {
      set({ dialogueIndex: dialogueIndex + 1 });
    }
  },
  submitPrompt: async () => {
    const prompt = get().input.trim();

    if (!prompt || get().status === "streaming") {
      return;
    }

    set({
      input: "",
      lastPrompt: prompt,
      responseText: "",
      dialogueIndex: 0,
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
