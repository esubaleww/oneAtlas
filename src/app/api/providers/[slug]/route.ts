import { readRecord } from "../../../../server/api-response";
import { getProvider } from "../../../../server/catalog";

export async function GET(request: Request, { params }: RouteContext<"/api/providers/[slug]">) {
  return readRecord(request, (await params).slug, getProvider);
}
