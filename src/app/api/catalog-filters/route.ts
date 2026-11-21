import { apiError, handleApiRead } from "../../../server/api-response";
import { getCatalogFilters } from "../../../server/catalog";

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.size > 0) {
    return apiError("INVALID_REQUEST");
  }

  return handleApiRead(async () => Response.json({ data: await getCatalogFilters() }));
}
