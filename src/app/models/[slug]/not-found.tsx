import Link from "next/link";

export default function ModelNotFound() {
  return (
    <section className="rounded-xl border border-line bg-surface px-6 py-10 shadow-xs sm:px-9">
      <h1 className="text-3xl font-semibold tracking-tight">Model not found</h1>
      <p className="mt-3 text-sm text-muted">Search the catalog to find a listed model.</p>
      <Link href="/" className="catalog-button mt-5">Back to models</Link>
    </section>
  );
}
