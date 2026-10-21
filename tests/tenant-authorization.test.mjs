import test from 'node:test';
import assert from 'node:assert/strict';
import { requireTenantAccess, AuthorizationError } from '../src/lib/tenant.ts';

const ctx = { userId: 'member-1', mosqueId: 'masjid-A', permissions: new Set(['finance.read']) };

test('allows exact tenant with explicit permission', () => {
  assert.equal(requireTenantAccess(ctx, 'masjid-A', 'finance.read'), ctx);
});
test('denies cross-tenant access regardless of permission', () => {
  assert.throws(() => requireTenantAccess(ctx, 'masjid-B', 'finance.read'), AuthorizationError);
});
test('denies missing permission', () => {
  assert.throws(() => requireTenantAccess(ctx, 'masjid-A', 'finance.approve'), AuthorizationError);
});
test('denies anonymous request', () => {
  assert.throws(() => requireTenantAccess(null, 'masjid-A', 'finance.read'), AuthorizationError);
});
