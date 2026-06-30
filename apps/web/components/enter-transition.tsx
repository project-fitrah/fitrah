"use client";

type EnterTransitionProps = {
  active: boolean;
};

export function EnterTransition({ active }: EnterTransitionProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="enter-transition pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
      <div className="enter-transition__ring absolute h-4 w-4 rounded-full bg-fitrah-emerald" />
      <p className="enter-transition__label relative z-10 text-sm font-medium tracking-[0.2em] text-white uppercase">
        Welkom
      </p>
    </div>
  );
}
