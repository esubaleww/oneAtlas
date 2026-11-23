export function SourceLink({ url, children, fallback = children }: {
  url: string | null;
  children: string;
  fallback?: string;
}) {
  const source = url && URL.canParse(url) ? new URL(url) : null;
  if (source?.protocol !== "https:" && source?.protocol !== "http:") {
    return <>{fallback}</>;
  }

  return (
    <a href={source.href} className="rounded-sm font-medium text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent" target="_blank" rel="noreferrer">
      {children}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
