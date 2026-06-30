"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { EnterTransition } from "@/components/enter-transition";
import { LandingPage } from "@/components/landing-page";

type ViewPhase = "landing" | "transitioning" | "chat";

const TRANSITION_MS = 1100;

export default function HomePage() {
  const [phase, setPhase] = useState<ViewPhase>("landing");

  const handleEnter = useCallback(() => {
    if (phase !== "landing") {
      return;
    }

    setPhase("transitioning");
  }, [phase]);

  useEffect(() => {
    if (phase !== "transitioning") {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase("chat");
    }, TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {phase !== "chat" ? <LandingPage onEnter={handleEnter} isExiting={phase === "transitioning"} /> : null}

      <EnterTransition active={phase === "transitioning"} />

      {phase === "chat" ? (
        <div className="chat-enter">
          <ChatInterface />
        </div>
      ) : null}
    </>
  );
}
