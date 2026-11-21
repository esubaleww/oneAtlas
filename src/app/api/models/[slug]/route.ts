import { catalogSlug } from "../../../../catalog/params";
import { apiError, handleApiRead } from "../../../../server/api-response";
import { getModel } from "../../../../server/catalog";

export async function GET(request: Request, { params }: RouteContext<"/api/models/[slug]">) {
  const slug = catalogSlug.safeParse((await params).slug);
  if (!slug.success || new URL(request.url).searchParams.size > 0) {
    return apiError("INVALID_REQUEST", slug.error);
  }

  return handleApiRead(async () => {
    const model = await getModel(slug.data);
    return model ? Response.json({ data: model }) : apiError("NOT_FOUND");
  });
}
