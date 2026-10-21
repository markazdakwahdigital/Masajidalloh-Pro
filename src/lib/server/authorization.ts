import 'server-only';
import { PrismaClient } from '@prisma/client';
import { AuthorizationError, type AuthenticatedTenantContext } from '../tenant';

/**
 * A server-authenticated actor MUST be obtained from a verified session provider.
 * Never pass client-submitted userId here. Auth provider integration is pending.
 */
export type VerifiedActor = Readonly<{ userId: string }>;
type MembershipRow = {
  userId: string;
  mosqueId: string;
  status: string;
  mosque: { status: string };
  roles: Array<{ role: { permissions: Array<{ permission: { key: string } }> } }>;
};
type MembershipReader = {
  mosqueMembership: {
    findUnique(args: {
      where: { mosqueId_userId: { mosqueId: string; userId: string } };
      include: { mosque: true; roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } };
    }): Promise<MembershipRow | null>;
  };
};

export async function resolveTenantContext(
  reader: MembershipReader,
  actor: VerifiedActor | null,
  mosqueId: string,
): Promise<AuthenticatedTenantContext> {
  if (!actor?.userId || !mosqueId) throw new AuthorizationError();
  const membership = await reader.mosqueMembership.findUnique({
    where: { mosqueId_userId: { mosqueId, userId: actor.userId } },
    include: { mosque: true, roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } },
  });
  if (!membership || membership.userId !== actor.userId ||
      membership.mosqueId !== mosqueId ||
      membership.status !== 'ACTIVE' || membership.mosque.status !== 'ACTIVE') {
    throw new AuthorizationError();
  }
  const permissions = new Set(
    membership.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)),
  );
  return { userId: actor.userId, mosqueId, permissions };
}

export async function withTenantPermission<T>(
  reader: MembershipReader,
  actor: VerifiedActor | null,
  mosqueId: string,
  permission: string,
  perform: (db: PrismaClient, context: AuthenticatedTenantContext) => Promise<T>,
  prisma: PrismaClient,
): Promise<T> {
  const context = await resolveTenantContext(reader, actor, mosqueId);
  if (!context.permissions.has(permission)) throw new AuthorizationError();
  return perform(prisma, context);
}
