/**
 * Connection string for Postgres (Vercel / Supabase / Neon expose different env names).
 */
export function getDatabaseConnectionString(): string | undefined {
  const u =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim();
  return u || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseConnectionString());
}
