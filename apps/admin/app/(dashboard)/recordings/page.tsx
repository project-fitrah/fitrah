import { Recorder } from "@/components/Recorder";

export default function RecordingsPage() {
  return (
    <section className="p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Recordings</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Transcriptie Pipeline</h2>
        <p className="mt-1 text-sm text-slate-300">Neem op, sla op en structureer opnames vanuit een centrale workflow.</p>
      </div>
      <Recorder />
    </section>
  );
}
