export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:py-8 xl:grid-cols-[440px_minmax(0,1fr)]" aria-busy>
      <div className="shimmer h-[620px] rounded-2xl border border-line bg-surface" />
      <div className="shimmer hidden h-[620px] rounded-2xl border border-line bg-surface/60 lg:block" />
    </div>
  );
}
