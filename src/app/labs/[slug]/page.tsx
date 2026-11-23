import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { catalogSlug } from "../../../catalog/params";
import { getLab } from "../../../server/catalog";
import { LabView } from "../../directory/directory-views";

const readLab = cache(async (slug: string) =>
  catalogSlug.safeParse(slug).success ? getLab(slug) : null,
);

export async function generateMetadata({ params }: PageProps<"/labs/[slug]">): Promise<Metadata> {
  try {
    const lab = await readLab((await params).slug);
    return lab ? { title: lab.name, description: lab.description } : { title: "Lab not found" };
  } catch {
    return { title: "Directory unavailable" };
  }
}

export default async function LabPage({ params }: PageProps<"/labs/[slug]">) {
  const lab = await readLab((await params).slug);
  if (!lab) {
    notFound();
  }

  return <LabView lab={lab} />;
}
