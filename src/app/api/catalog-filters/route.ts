import { readCollection } from "../../../server/api-response";
import { getCatalogFilters } from "../../../server/catalog";

export async function GET(request: Request) {
  return readCollection(request, getCatalogFilters);
}
