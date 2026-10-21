import 'server-only';
import type { PrismaClient } from '@prisma/client';
import { AuthorizationError, type AuthenticatedTenantContext } from '../tenant';

/** Actor identity must originate from a verified SERVER session, never from request JSON. */
export type VerifiedActor = Readonly<{ userId: string }>;

export async function resolveTenantContext(
  db: PrismaClient,
  actor: VerifiedActor | null,
  mosqueId: string,
): Promise<AuthenticatedTenantContext> {
  if (!actor?.userId || !mosqueId) throw new AuthorizationError();
  const membership = await db.mosqueMembership.findUnique({
    where: { mosqueId_userId: { mosqueId, userId: actor.userId } },
    include: {
      mosque: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });
  if (!membership ||
      membership.userId !== actor.userId ||
      membership.mosqueId !== mosqueId ||
      membership.status !== 'ACTIVE' ||
      membership.mosque.status !== 'ACTIVE') {
    throw new AuthorizationError();
  }
  const permissions = new Set(
    membership.roles.flatMap((entry) =>
      entry.role.permissions.map((grant) => grant.permission.key)
    ),
  );
  return { userId: actor.userId, mosqueId, permissions };
}

/** Must be called inside a protected server entrypoint after session verification. */
export async function withTenantPermission<T>(
  db: PrismaClient,
  actor: VerifiedActor | null,
  mosqueId: string,
  permission: string,
  perform: (db: PrismaClient, context: AuthenticatedTenantContext) => Promise<T>,
): Promise<T> {
  const context = await resolveTenantContext(db, actor, mosqueId);
  if (!context.permissions.has(permission)) throw new AuthorizationError();
  return perform(db, context);
}
