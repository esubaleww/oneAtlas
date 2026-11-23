import "server-only";

import type { ZodError } from "zod";
import { catalogSlug } from "../catalog/params";
import { Prisma } from "../generated/prisma/client";

const errors = {
  INVALID_REQUEST: { status: 400, message: "The request parameters are invalid." },
  NOT_FOUND: { status: 404, message: "The requested record was not found." },
  SERVICE_UNAVAILABLE: { status: 503, message: "The catalog is temporarily unavailable." },
  INTERNAL_ERROR: { status: 500, message: "The catalog request could not be completed." },
} as const;

const unavailableCodes = new Set(["P1001", "P1002", "P1017", "P2024", "P2037"]);

export function apiError(code: keyof typeof errors, validation?: ZodError) {
  const { status, message } = errors[code];
  const issues = validation?.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "query",
    message: issue.code === "unrecognized_keys" ? "Use only supported parameters." : issue.message,
  }));

  return Response.json({ error: { code, message, issues } }, { status });
}

export async function handleApiRead(read: () => Promise<Response>) {
  try {
    return await read();
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Prisma.PrismaClientInitializationError
        ? error.errorCode
        : undefined;

    console.error("Catalog read failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });

    return apiError(code && unavailableCodes.has(code) ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR");
  }
}

export function readCollection<T>(request: Request, read: () => Promise<T>) {
  if (new URL(request.url).searchParams.size > 0) {
    return apiError("INVALID_REQUEST");
  }
  return handleApiRead(async () => Response.json({ data: await read() }));
}

export function readRecord<T>(request: Request, slug: string, read: (slug: string) => Promise<T | null>) {
  const parsed = catalogSlug.safeParse(slug);
  if (!parsed.success || new URL(request.url).searchParams.size > 0) {
    return apiError("INVALID_REQUEST", parsed.error);
  }

  return handleApiRead(async () => {
    const record = await read(parsed.data);
    return record ? Response.json({ data: record }) : apiError("NOT_FOUND");
  });
}
