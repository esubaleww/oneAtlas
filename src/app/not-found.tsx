import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <Link
        href="/"
        className="mt-5 inline-block rounded-sm font-medium text-accent underline underline-offset-4"
      >
        Back to the catalog
      </Link>
    </>
  );
}
