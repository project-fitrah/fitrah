"use client";

type LandingPageProps = {
  onEnter: () => void;
  isExiting: boolean;
};

export function LandingPage({ onEnter, isExiting }: LandingPageProps) {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center px-6 transition-all duration-700 ease-out ${
        isExiting ? "pointer-events-none scale-[0.98] opacity-0" : "scale-100 opacity-100"
      }`}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fitrah-emerald">Fitrah</p>

        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-fitrah-deep md:text-5xl">
          Ontdek je natuurlijke weg
        </h1>

        <p className="mt-5 max-w-sm text-base leading-7 text-fitrah-deep/70">
          Een rustige ruimte om vragen te stellen en samen na te denken over wat echt telt.
        </p>

        <button
          type="button"
          onClick={onEnter}
          disabled={isExiting}
          className="group mt-10 inline-flex items-center gap-2 rounded-full border border-fitrah-deep/15 bg-white/60 px-5 py-2.5 text-sm font-medium text-fitrah-deep shadow-sm backdrop-blur transition hover:border-fitrah-emerald/30 hover:bg-white hover:shadow-md disabled:opacity-50"
        >
          Begin het gesprek
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      </div>
    </main>
  );
}
