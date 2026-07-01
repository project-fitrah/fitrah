"use client";

import { useCallback, useEffect, useState } from "react";
import { EnterTransition } from "@/components/enter-transition";
import { LandingPage } from "@/components/landing-page";
import { WorldExperience } from "@/components/world-experience";

type ViewPhase = "landing" | "transitioning" | "world";

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
      setPhase("world");
      console.log("test");
    }, TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {phase !== "world" && <LandingPage onEnter={handleEnter} isExiting={phase === "transitioning"} />}

      <EnterTransition active={phase === "transitioning"} />

      {phase === "world" && (
        <div className="world-enter">
          <WorldExperience />
        </div>
      )}
    </>
  );
}
