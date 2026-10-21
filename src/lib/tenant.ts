/** Tenant context must be sourced from authenticated server sessions, NEVER from an arbitrary client-supplied mosque ID. */
export type AuthenticatedTenantContext = Readonly<{userId:string; mosqueId:string; permissions:ReadonlySet<string>}>;
export class AuthorizationError extends Error { constructor(){super('Akses tidak diizinkan');this.name='AuthorizationError';} }
export function requireTenantAccess(context:AuthenticatedTenantContext|null, mosqueId:string, permission:string):AuthenticatedTenantContext {
  if (!context || context.mosqueId!==mosqueId || !context.permissions.has(permission)) throw new AuthorizationError();
  return context;
}
/** This is a defensive helper only. Membership verification in database and server session auth are NOT implemented yet. */
