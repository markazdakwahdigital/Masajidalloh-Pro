/** Accept a URI copied from an env example or the Supabase psql command. */
export function normalizeDatabaseUrl(value: string): string {
  let result = value.trim().replace(/^DATABASE_URL\s*=\s*/, '').replace(/^psql\s+/, '');
  if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) result = result.slice(1, -1);
  return result.trim();
}
