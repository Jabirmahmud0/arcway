import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { createShadowAuditTrade, getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("Database is unavailable.");

const [reviewer] = await db.select().from(users).where(eq(users.role, "reviewer")).limit(1);
if (!reviewer) throw new Error("A Reviewer account is required before seeding the Shadow Audit case.");

const seeded = await createShadowAuditTrade(reviewer.id);
console.log(JSON.stringify(seeded));
