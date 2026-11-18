export function AuthHeading({ title, subtitle }: { title: React.ReactNode; subtitle: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[40px] leading-none tracking-tight text-fg">{title}</h1>
      <p className="mt-3 text-[15px] text-fg-muted">{subtitle}</p>
    </div>
  );
}
