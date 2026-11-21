import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export function createDbClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("The OneAtlas database connection is missing. Set DATABASE_URL.");
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
