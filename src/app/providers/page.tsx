import type { Metadata } from "next";
import { connection } from "next/server";
import { listProviders } from "../../server/catalog";
import { DirectoryView } from "../directory/directory-views";

export const metadata: Metadata = { title: "Providers" };

export default async function ProvidersPage() {
  await connection();
  return <DirectoryView kind="providers" entries={await listProviders()} />;
}
