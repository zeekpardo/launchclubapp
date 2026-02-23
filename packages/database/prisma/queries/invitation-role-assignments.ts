import { db } from "../client";

export async function saveInvitationRoleAssignment(data: {
  invitationId: string;
  lcRole: string;
  siteIds: string[];
  groupIds: string[];
}) {
  return db.invitationRoleAssignment.upsert({
    where: { invitationId: data.invitationId },
    create: data,
    update: { lcRole: data.lcRole, siteIds: data.siteIds, groupIds: data.groupIds },
  });
}

export async function getInvitationRoleAssignment(invitationId: string) {
  return db.invitationRoleAssignment.findUnique({ where: { invitationId } });
}

export async function deleteInvitationRoleAssignment(invitationId: string) {
  return db.invitationRoleAssignment.delete({ where: { invitationId } }).catch(() => null);
}
