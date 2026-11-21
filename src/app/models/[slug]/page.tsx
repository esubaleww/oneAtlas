import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogSlug, parseCatalogQuery } from "../../../catalog/params";
import { getModel } from "../../../server/catalog";
import { ModelDetails } from "./model-details";

const readModel = cache(async (slug: string) => {
  const parsed = catalogSlug.safeParse(slug);
  return parsed.success ? getModel(parsed.data) : null;
});

function returnHref(from: string | string[] | undefined) {
  if (typeof from !== "string") {
    return "/";
  }
  const query = new URLSearchParams(from);
  return query.size && parseCatalogQuery(query).success ? `/?${query}` : "/";
}

export async function generateMetadata({ params }: PageProps<"/models/[slug]">): Promise<Metadata> {
  try {
    const { slug } = await params;
    const model = await readModel(slug);
    return model ? { title: model.name, description: model.description } : { title: "Model not found" };
  } catch {
    return { title: "Model details unavailable" };
  }
}

export default async function ModelPage({ params, searchParams }: PageProps<"/models/[slug]">) {
  const [{ slug }, { from }] = await Promise.all([params, searchParams]);
  const model = await readModel(slug);
  if (!model) {
    notFound();
  }

  return <ModelDetails model={model} backHref={returnHref(from)} />;
}
