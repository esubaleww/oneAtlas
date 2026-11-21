import { parseCatalogQuery } from "../../../catalog/params";
import { apiError, handleApiRead } from "../../../server/api-response";
import { listModels } from "../../../server/catalog";

export async function GET(request: Request) {
  const query = parseCatalogQuery(new URL(request.url).searchParams);
  if (!query.success) {
    return apiError("INVALID_REQUEST", query.error);
  }

  return handleApiRead(async () => Response.json({ data: await listModels(query.data) }));
}
