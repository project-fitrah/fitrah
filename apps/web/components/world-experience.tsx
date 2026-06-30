"use client";

import { Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Euler, Vector3 } from "three";
import { Joe_animated } from "@components/Joe_animated.jsx";
import { Model as PlatformModel } from "@components/Platform.jsx";
import { Model as SpaceModel } from "@components/Space.jsx";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";
import { buildDialogueView } from "@/lib/dialogue-chunks";
import { selectJoePose, useJoeChatStore } from "@/stores/joe-chat-store";

const DESKTOP_CAMERA: [number, number, number] = [0, 0.62, 3];
const CINEMATIC_CAMERA: [number, number, number] = [0, 0.42, 4.4];
const JOE_POSITION: [number, number, number] = [0, -0.95, -1.35];
const PLATFORM_POSITION: [number, number, number] = [0, -1.52, 1.05];
const LOOK_TARGET: [number, number, number] = [0, 0.05, -1.35];
const WALK_BOUNDS = {
  minX: -2.4,
  maxX: 2.4,
  minZ: 0.2,
  maxZ: 4.6
};
const POINTER_LOCK_COOLDOWN_MS = 600;
const LOOK_SENSITIVITY = 0.0022;

function normalizeKey(key: string | undefined): string | null {
  if (!key) {
    return null;
  }

  return key.toLowerCase();
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

function CinematicCamera({ active }: { active: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!active) {
      return;
    }

    camera.position.set(...CINEMATIC_CAMERA);
    camera.lookAt(...LOOK_TARGET);
  }, [active, camera]);

  return null;
}

type FirstPersonControllerProps = {
  enabled: boolean;
  onLockChange: (locked: boolean) => void;
};

function FirstPersonController({ enabled, onLockChange }: FirstPersonControllerProps) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const euler = useRef(new Euler(0, 0, 0, "YXZ"));
  const locked = useRef(false);
  const canRequestLock = useRef(true);

  useEffect(() => {
    camera.position.set(...DESKTOP_CAMERA);
    camera.lookAt(...LOOK_TARGET);
    euler.current.setFromQuaternion(camera.quaternion, "YXZ");

    const canvas = gl.domElement;

    function clearKeys() {
      keys.current.clear();
    }

    function handlePointerLockChange() {
      const isLocked = document.pointerLockElement === canvas;
      locked.current = isLocked;
      onLockChange(isLocked);

      if (!isLocked) {
        clearKeys();
        canRequestLock.current = false;
        window.setTimeout(() => {
          canRequestLock.current = true;
        }, POINTER_LOCK_COOLDOWN_MS);
      }
    }

    function requestPointerLock() {
      if (!enabled || locked.current || !canRequestLock.current || isTypingTarget(document.activeElement)) {
        return;
      }

      void canvas.requestPointerLock().catch(() => {
        // Browser may reject lock if not user-initiated or during cooldown.
      });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat || isTypingTarget(event.target)) {
        return;
      }

      const key = normalizeKey(event.key);

      if (!key) {
        return;
      }

      if (enabled && key.startsWith("arrow")) {
        event.preventDefault();
      }

      keys.current.add(key);
    }

    function handleKeyUp(event: KeyboardEvent) {
      const key = normalizeKey(event.key);

      if (key) {
        keys.current.delete(key);
      }
    }

    function handleBlur() {
      clearKeys();
    }

    function handleMouseMove(event: MouseEvent) {
      if (!locked.current) {
        return;
      }

      euler.current.y -= event.movementX * LOOK_SENSITIVITY;
      euler.current.x -= event.movementY * LOOK_SENSITIVITY;
      euler.current.x = Math.max(-Math.PI / 2 + 0.08, Math.min(Math.PI / 2 - 0.08, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    }

    canvas.addEventListener("click", requestPointerLock);
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      canvas.removeEventListener("click", requestPointerLock);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      clearKeys();

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [camera, enabled, gl.domElement, onLockChange]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    movement.current.set(0, 0, 0);
    camera.getWorldDirection(forward.current);
    forward.current.y = 0;

    if (forward.current.lengthSq() === 0) {
      return;
    }

    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    if (keys.current.has("arrowup")) {
      movement.current.add(forward.current);
    }

    if (keys.current.has("arrowdown")) {
      movement.current.sub(forward.current);
    }

    if (keys.current.has("arrowleft")) {
      movement.current.sub(right.current);
    }

    if (keys.current.has("arrowright")) {
      movement.current.add(right.current);
    }

    if (movement.current.lengthSq() === 0) {
      return;
    }

    movement.current.normalize().multiplyScalar(delta * 2.1);
    camera.position.add(movement.current);
    camera.position.x = Math.min(WALK_BOUNDS.maxX, Math.max(WALK_BOUNDS.minX, camera.position.x));
    camera.position.z = Math.min(WALK_BOUNDS.maxZ, Math.max(WALK_BOUNDS.minZ, camera.position.z));
    camera.position.y = DESKTOP_CAMERA[1];
  });

  return null;
}

type WorldSceneProps = {
  cinematicMode: boolean;
  controlsEnabled: boolean;
  onLockChange: (locked: boolean) => void;
};

function WorldScene({ cinematicMode, controlsEnabled, onLockChange }: WorldSceneProps) {
  const joePose = useJoeChatStore(selectJoePose);
  const starCount = cinematicMode ? 2800 : 9000;

  return (
    <>
      <color attach="background" args={["#050816"]} />
      <fog attach="fog" args={["#050816", 14, 70]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#b8d4ff", "#17111f", 1.35]} />
      <directionalLight position={[5, 7, 4]} intensity={2.4} />
      <pointLight position={[0, 1.4, -1.4]} color="#8ee7ff" intensity={12} distance={9} />
      <pointLight position={[-3, 2, 4]} color="#9f7aea" intensity={8} distance={14} />

      <Suspense fallback={null}>
        <SpaceModel position={[0, -1, 0]} scale={520} />
        <PlatformModel position={PLATFORM_POSITION} rotation={[0, Math.PI / 4, 0]} scale={0.065} />
        <Joe_animated pose={joePose} position={JOE_POSITION} rotation={[0, -0.04, 0]} />
      </Suspense>

      <Stars radius={90} depth={60} count={starCount} factor={6} saturation={0.35} fade speed={0.2} />

      <mesh position={[0, -1.58, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.9, 64]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.08} />
      </mesh>

      {cinematicMode ? <CinematicCamera active={controlsEnabled} /> : null}
      {!cinematicMode ? <FirstPersonController enabled={controlsEnabled} onLockChange={onLockChange} /> : null}
    </>
  );
}

export function WorldExperience() {
  const isTouchDevice = useIsTouchDevice();
  const input = useJoeChatStore((state) => state.input);
  const lastPrompt = useJoeChatStore((state) => state.lastPrompt);
  const responseText = useJoeChatStore((state) => state.responseText);
  const status = useJoeChatStore((state) => state.status);
  const error = useJoeChatStore((state) => state.error);
  const setInput = useJoeChatStore((state) => state.setInput);
  const submitPrompt = useJoeChatStore((state) => state.submitPrompt);
  const dialogueIndex = useJoeChatStore((state) => state.dialogueIndex);
  const advanceDialogue = useJoeChatStore((state) => state.advanceDialogue);
  const joePose = useJoeChatStore(selectJoePose);
  const [hasEntered, setHasEntered] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const isStreaming = status === "streaming";
  const canSubmit = input.trim().length > 0 && !isStreaming;

  const dialogue = useMemo(() => buildDialogueView(responseText, dialogueIndex, 2), [responseText, dialogueIndex]);

  const joeSpeech =
    dialogue.displayText ||
    responseText.trim() ||
    (isStreaming ? "Joe formuleert zijn antwoord..." : "Joe luistert. Deel rustig wat op je hart ligt.");

  const speechHint = dialogue.canAdvance
    ? isTouchDevice
      ? null
      : "Druk Enter om verder te lezen"
    : isStreaming && dialogue.isLastChunk
      ? "Joe spreekt nog..."
      : null;

  useEffect(() => {
    if (isTouchDevice) {
      return;
    }

    function handleDialogueAdvance(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.repeat || isTypingTarget(event.target)) {
        return;
      }

      if (!dialogue.canAdvance) {
        return;
      }

      event.preventDefault();
      advanceDialogue();
    }

    window.addEventListener("keydown", handleDialogueAdvance);

    return () => {
      window.removeEventListener("keydown", handleDialogueAdvance);
    };
  }, [advanceDialogue, dialogue.canAdvance, isTouchDevice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPrompt();
  }

  function handleEnterWorld() {
    setHasEntered(true);
  }

  function handleInputFocus() {
    setHasEntered(true);

    if (!isTouchDevice && document.pointerLockElement instanceof HTMLCanvasElement) {
      document.exitPointerLock();
    }
  }

  const initialCamera = isTouchDevice ? CINEMATIC_CAMERA : DESKTOP_CAMERA;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#050816] text-white">
      <Canvas
        camera={{ position: initialCamera, fov: isTouchDevice ? 50 : 58, near: 0.1, far: 1200 }}
        dpr={isTouchDevice ? [1, 1.5] : [1, 2]}
        shadows
      >
        <WorldScene
          cinematicMode={isTouchDevice}
          controlsEnabled={hasEntered}
          onLockChange={setPointerLocked}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(5,8,22,0.55)_100%)]" />

      {!hasEntered ? (
        <button
          type="button"
          onClick={handleEnterWorld}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050816]/75 px-6 text-center backdrop-blur-sm transition hover:bg-[#050816]/65"
        >
          <span className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-200/90">Fitrah</span>
          <span className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {isTouchDevice ? "Neem plaats voor het gesprek" : "Stap het platform in"}
          </span>
          <span className="mt-5 max-w-sm text-sm leading-7 text-white/70">
            {isTouchDevice
              ? "Je zit tegenover Joe in de ruimte. Neem de tijd voor je vraag."
              : "Klik om binnen te komen. Gebruik de pijltjestoetsen om te bewegen en Enter om door Joe's woorden te gaan."}
          </span>
        </button>
      ) : null}

      {hasEntered && !isTouchDevice && !pointerLocked ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-6">
          <p className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-white/65 backdrop-blur">
            Klik op de wereld om rond te kijken.
          </p>
        </div>
      ) : null}

      <div className="absolute inset-x-0 top-24 z-10 flex justify-center px-5 md:top-28">
        <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/85 px-5 py-5 shadow-2xl backdrop-blur">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-emerald-200/80">Joe</p>
          <p className="mt-3 text-base leading-8 text-white/95 md:text-lg">{joeSpeech}</p>

          {speechHint ? <p className="mt-4 text-xs text-white/45">{speechHint}</p> : null}

          {dialogue.canAdvance && isTouchDevice ? (
            <button
              type="button"
              onClick={() => advanceDialogue()}
              className="mt-5 w-full rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-200/15"
            >
              Verder lezen
            </button>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-white/65 backdrop-blur">
        {joePose === "talking" ? "Joe spreekt" : isTouchDevice ? "Gesprek" : pointerLocked ? "Aanwezig" : "Op het platform"}
      </div>

      <form
        onSubmit={handleSubmit}
        className="absolute inset-x-4 bottom-4 z-10 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur md:bottom-8"
      >
        <label htmlFor="joe-message" className="sr-only">
          Jouw vraag aan Joe
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="joe-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={handleInputFocus}
            placeholder="Wat houdt je bezig?"
            className="min-h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none placeholder:text-white/40 focus:border-emerald-200/40"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl border border-white/15 bg-white/90 px-6 py-3 font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:border-transparent disabled:bg-white/20 disabled:text-white/45"
          >
            {isStreaming ? "Joe spreekt..." : joePose === "talking" ? "Luister..." : "Deel"}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1 px-1 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <span className="line-clamp-2">
            {lastPrompt ? `Je vroeg: "${lastPrompt}"` : "Neem de tijd. Er is geen haast in dit gesprek."}
          </span>
          {error ? <span className="font-medium text-red-300">{error}</span> : null}
        </div>
      </form>
    </main>
  );
}
