import type { Metadata } from "next";
import { connection } from "next/server";
import { listLabs } from "../../server/catalog";
import { DirectoryView } from "../directory/directory-views";

export const metadata: Metadata = { title: "Labs" };

export default async function LabsPage() {
  await connection();
  return <DirectoryView kind="labs" entries={await listLabs()} />;
}
