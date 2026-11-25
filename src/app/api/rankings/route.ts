import { parseRankingsQuery } from "../../../catalog/params";
import { apiError, handleApiRead } from "../../../server/api-response";
import { getRankings } from "../../../server/catalog";

export function GET(request: Request) {
  const parsed = parseRankingsQuery(new URL(request.url).searchParams);
  if (!parsed.success) return apiError("INVALID_REQUEST", parsed.error);

  return handleApiRead(async () => {
    const rankings = await getRankings(parsed.data);
    return rankings ? Response.json({ data: rankings }) : apiError("NOT_FOUND");
  });
}
