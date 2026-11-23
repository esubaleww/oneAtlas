import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogSlug } from "../../../catalog/params";
import { getProvider } from "../../../server/catalog";
import { ProviderView } from "../../directory/directory-views";

const readProvider = cache(async (slug: string) =>
  catalogSlug.safeParse(slug).success ? getProvider(slug) : null,
);

export async function generateMetadata({ params }: PageProps<"/providers/[slug]">): Promise<Metadata> {
  try {
    const provider = await readProvider((await params).slug);
    return provider ? { title: provider.name, description: provider.description } : { title: "Provider not found" };
  } catch {
    return { title: "Directory unavailable" };
  }
}

export default async function ProviderPage({ params }: PageProps<"/providers/[slug]">) {
  const provider = await readProvider((await params).slug);
  if (!provider) {
    notFound();
  }

  return <ProviderView provider={provider} />;
}
