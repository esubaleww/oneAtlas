import { parseComparisonParams } from "../../../catalog/params";
import { apiError, handleApiRead } from "../../../server/api-response";
import { getComparison } from "../../../server/catalog";

export async function GET(request: Request) {
  const ids = parseComparisonParams(new URL(request.url).searchParams);
  if (!ids.success) {
    return apiError("INVALID_REQUEST", ids.error);
  }

  return handleApiRead(async () => {
    const comparison = await getComparison(ids.data);
    return comparison ? Response.json({ data: comparison }) : apiError("NOT_FOUND");
  });
}
