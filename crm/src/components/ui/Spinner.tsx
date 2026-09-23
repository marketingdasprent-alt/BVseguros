export function Spinner() {
  return <div role="status" aria-label="A carregar" className="panel p-6 space-y-5">
    <span className="sr-only">A carregar dados…</span>
    <div aria-hidden="true" className="h-4 w-36 rounded bg-slate-100" />
    <div aria-hidden="true" className="grid grid-cols-2 gap-4">
      <div className="h-20 rounded-lg bg-slate-100 motion-safe:animate-pulse" />
      <div className="h-20 rounded-lg bg-slate-100 motion-safe:animate-pulse" />
    </div>
    <div aria-hidden="true" className="h-3 w-2/3 rounded bg-slate-100" />
  </div>;
}
