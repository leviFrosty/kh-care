import { eq, and } from "drizzle-orm";
import { db } from "../db/drizzle";
import { Perm, permissions, rolePermissions, teamRoles } from "../db/schema";

/** Check if user has a specific permission for a team */
export async function canUserPerformAction(
  userId: number,
  teamId: number,
  permission: Perm
) {
  // Find the user's role in the team
  const userRole = await db
    .select()
    .from(teamRoles)
    .where(and(eq(teamRoles.userId, userId), eq(teamRoles.teamId, teamId)))
    .limit(1)
    .execute();

  if (userRole.length === 0) {
    return false; // User is not part of the team
  }

  // Find if the user's role has the required permission
  const perms = await db
    .select()
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(rolePermissions.roleId, userRole[0].roleId),
        eq(permissions.name, permission)
      )
    )
    .limit(1)
    .execute();

  return perms.length > 0;
}
