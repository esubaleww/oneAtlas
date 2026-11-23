import { globalSearchQuery } from "../../../catalog/params";
import { apiError, handleApiRead } from "../../../server/api-response";
import { searchCatalog } from "../../../server/catalog";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = globalSearchQuery.safeParse(params.get("q"));
  if (!query.success || params.size !== 1) {
    return apiError("INVALID_REQUEST", query.error);
  }

  return handleApiRead(async () => Response.json({ data: await searchCatalog(query.data) }));
}
