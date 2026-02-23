import { db } from "@repo/database";

export async function canAccessSite(userId: string, siteId: string): Promise<boolean> {
  const userSite = await db.userSite.findUnique({
    where: { userId_siteId: { userId, siteId } },
  });
  return userSite !== null;
}

export async function canManageGroup(userId: string, groupId: string): Promise<boolean> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { siteId: true },
  });
  if (!group) return false;
  const [userSite, userGroup] = await Promise.all([
    db.userSite.findUnique({ where: { userId_siteId: { userId, siteId: group.siteId } } }),
    db.userGroup.findUnique({ where: { userId_groupId: { userId, groupId } } }),
  ]);
  return userSite !== null || userGroup !== null;
}
