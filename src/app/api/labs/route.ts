import { readCollection } from "../../../server/api-response";
import { listLabs } from "../../../server/catalog";

export function GET(request: Request) {
  return readCollection(request, listLabs);
}
