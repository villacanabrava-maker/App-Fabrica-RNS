import { describe, expect, it } from 'vitest';
import {
  canInviteRole,
  canManageTeam,
  canModifyMembership,
  isMembershipRole,
} from '../../../apps/control-plane/src/server/queries/rbac';

type Role = 'owner' | 'admin' | 'engineer' | 'viewer';
const ROLES: Role[] = ['owner', 'admin', 'engineer', 'viewer'];

describe('canModifyMembership (escalada admin -> owner)', () => {
  it('owner pode atribuir qualquer papel, inclusive owner, e alterar/remover qualquer alvo', () => {
    for (const target of ROLES) {
      for (const next of [...ROLES, null] as (Role | null)[]) {
        expect(canModifyMembership('owner', target, next)).toBe(true);
      }
    }
  });

  it('admin NÃO atribui owner (member -> owner, nem a si próprio admin -> owner)', () => {
    expect(canModifyMembership('admin', 'viewer', 'owner')).toBe(false);
    expect(canModifyMembership('admin', 'engineer', 'owner')).toBe(false);
    expect(canModifyMembership('admin', 'admin', 'owner')).toBe(false);
  });

  it('admin NÃO rebaixa nem remove owner', () => {
    for (const next of ['admin', 'engineer', 'viewer', null] as (Role | null)[]) {
      expect(canModifyMembership('admin', 'owner', next)).toBe(false);
    }
  });

  it('admin continua gerenciando papéis abaixo de owner', () => {
    expect(canModifyMembership('admin', 'viewer', 'engineer')).toBe(true);
    expect(canModifyMembership('admin', 'engineer', 'admin')).toBe(true);
    expect(canModifyMembership('admin', 'admin', 'viewer')).toBe(true);
    expect(canModifyMembership('admin', 'viewer', null)).toBe(true);
  });

  it('engineer e viewer nunca modificam memberships', () => {
    for (const actor of ['engineer', 'viewer'] as Role[]) {
      expect(canManageTeam(actor)).toBe(false);
      for (const target of ROLES) {
        for (const next of [...ROLES, null] as (Role | null)[]) {
          expect(canModifyMembership(actor, target, next)).toBe(false);
        }
      }
    }
  });
});

describe('canInviteRole (mesma regra de canModifyMembership, para convite)', () => {
  it('owner convida com qualquer papel, inclusive owner', () => {
    for (const role of ROLES) expect(canInviteRole('owner', role)).toBe(true);
  });

  it('admin convida qualquer papel, exceto owner', () => {
    expect(canInviteRole('admin', 'owner')).toBe(false);
    expect(canInviteRole('admin', 'admin')).toBe(true);
    expect(canInviteRole('admin', 'engineer')).toBe(true);
    expect(canInviteRole('admin', 'viewer')).toBe(true);
  });

  it('engineer e viewer nunca convidam', () => {
    for (const actor of ['engineer', 'viewer'] as Role[]) {
      for (const role of ROLES) expect(canInviteRole(actor, role)).toBe(false);
    }
  });
});

describe('isMembershipRole', () => {
  it('aceita só os quatro papéis conhecidos', () => {
    for (const role of ROLES) expect(isMembershipRole(role)).toBe(true);
    for (const bad of ['superadmin', 'OWNER', '', null, undefined, 1, {}]) expect(isMembershipRole(bad)).toBe(false);
  });
});
