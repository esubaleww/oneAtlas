import { readRecord } from "../../../../server/api-response";
import { getModel } from "../../../../server/catalog";

export async function GET(request: Request, { params }: RouteContext<"/api/models/[slug]">) {
  return readRecord(request, (await params).slug, getModel);
}
