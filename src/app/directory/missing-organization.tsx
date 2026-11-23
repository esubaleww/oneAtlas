import Link from "next/link";

export function MissingOrganization({ kind }: { kind: "Lab" | "Provider" }) {
  const directory = kind === "Lab" ? "labs" : "providers";
  return (
    <section className="rounded-xl border border-line bg-surface px-6 py-10 shadow-xs sm:px-9">
      <h1 className="text-3xl font-semibold tracking-tight">{kind} not found</h1>
      <p className="mt-3 text-sm text-muted">Browse the directory to find a listed {kind.toLowerCase()}.</p>
      <Link href={`/${directory}`} className="catalog-button mt-5">Back to {directory}</Link>
    </section>
  );
}
