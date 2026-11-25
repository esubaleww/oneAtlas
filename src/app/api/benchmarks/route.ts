import { readCollection } from "../../../server/api-response";
import { listBenchmarks } from "../../../server/catalog";

export function GET(request: Request) {
  return readCollection(request, listBenchmarks);
}
