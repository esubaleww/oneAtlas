import { readCollection } from "../../../server/api-response";
import { listProviders } from "../../../server/catalog";

export function GET(request: Request) {
  return readCollection(request, listProviders);
}
