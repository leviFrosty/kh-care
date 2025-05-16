"server-only";
import { eq, and } from "drizzle-orm";
import { permissions, rolePermissions, teamMembers } from "../db/schema";
import { db } from "@/lib/db/drizzle";
import { Perm } from "../db/permissions";

/** Check if user has a specific permission for a team */
export async function userCanPerformAction(
  userId: number,
  teamId: number,
  permissionName: Perm,
): Promise<boolean> {
  const result = await db
    .select()
    .from(teamMembers)
    .innerJoin(rolePermissions, eq(teamMembers.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.teamId, teamId),
        eq(permissions.name, permissionName),
      ),
    )
    .limit(1)
    .execute();

  return result.length > 0;
}
