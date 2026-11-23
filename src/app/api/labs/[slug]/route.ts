import { readRecord } from "../../../../server/api-response";
import { getLab } from "../../../../server/catalog";

export async function GET(request: Request, { params }: RouteContext<"/api/labs/[slug]">) {
  return readRecord(request, (await params).slug, getLab);
}
