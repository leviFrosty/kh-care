"server-only";
import { desc, and, eq, isNull, sql } from "drizzle-orm";
import { db } from "./drizzle";
import {
  activityLogs,
  TeamDataWithMembers,
  teamMembers,
  teams,
  users,
  tasks,
  NewTask,
  kanbanColumns,
  NewKanbanColumn,
  KanbanColumn,
} from "./schema";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";

export async function getUser() {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== "number"
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  },
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
      teamName: teams.name,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(15);
}

export async function getTeamForUser(): Promise<TeamDataWithMembers | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              role: {
                columns: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.team || null;
}

export async function createTask(
  data: Omit<
    NewTask,
    "id" | "createdAt" | "updatedAt" | "deletedAt" | "parentTaskId"
  >,
) {
  const task = await db
    .insert(tasks)
    .values({
      ...data,
    })
    .returning();

  return task[0];
}

export async function getTeamTasks(teamId: number) {
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.teamId, teamId), isNull(tasks.deletedAt)));
}

export async function updateTask(
  id: number,
  data: Partial<Omit<NewTask, "id" | "createdAt" | "updatedAt" | "deletedAt">>,
) {
  const task = await db
    .update(tasks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();

  return task[0];
}

export async function deleteTask(id: number, hardDelete = false) {
  if (hardDelete) {
    await db.delete(tasks).where(eq(tasks.id, id));
  } else {
    await db
      .update(tasks)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id));
  }
  return true;
}

export async function getTeamKanbanData(teamId: number) {
  const columns = await db.query.kanbanColumns.findMany({
    where: eq(kanbanColumns.teamId, teamId),
    orderBy: kanbanColumns.order,
    with: {
      tasks: {
        where: isNull(tasks.deletedAt),
        orderBy: tasks.order,
        with: {
          assignee: true,
        },
      },
    },
  });

  return columns;
}

export async function createKanbanColumn(data: NewKanbanColumn) {
  const maxOrder = await db
    .select({ order: sql<number>`max(${kanbanColumns.order})` })
    .from(kanbanColumns)
    .where(eq(kanbanColumns.teamId, data.teamId));

  const column = await db
    .insert(kanbanColumns)
    .values({
      ...data,
      order: (maxOrder[0]?.order || 0) + 1,
    })
    .returning();

  return column[0];
}

export async function updateKanbanColumn(
  id: number,
  data: Partial<Pick<KanbanColumn, "name" | "order">>,
) {
  const column = await db
    .update(kanbanColumns)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(kanbanColumns.id, id))
    .returning();

  return column[0];
}

export async function deleteKanbanColumn(id: number) {
  // Move tasks to the first column before deleting
  const firstColumn = await db.query.kanbanColumns.findFirst({
    where: eq(kanbanColumns.order, 1),
  });

  if (firstColumn) {
    await db
      .update(tasks)
      .set({ columnId: firstColumn.id })
      .where(eq(tasks.columnId, id));
  }

  await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
  return true;
}

export async function updateTaskColumn(
  taskId: number,
  columnId: number,
  order: number,
) {
  const task = await db
    .update(tasks)
    .set({
      columnId,
      order,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return task[0];
}

export async function reorderColumns(updates: { id: number; order: number }[]) {
  const results = await Promise.all(
    updates.map((update) =>
      db
        .update(kanbanColumns)
        .set({ order: update.order, updatedAt: new Date() })
        .where(eq(kanbanColumns.id, update.id))
        .returning(),
    ),
  );

  return results.map((r) => r[0]);
}
