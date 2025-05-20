"server-only";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  AnyPgColumn,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { Perm, Role } from "./permissions";

export function enumToPgEnum<T extends Record<string, any>>(
  myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

export const pgEnumRole = pgEnum("role", enumToPgEnum(Role));
export const fileType = pgEnum("type", ["file", "folder"]);
export const taskStatus = pgEnum("status", [
  "created",
  "todo",
  "in_progress",
  "done",
]);
export const taskType = pgEnum("type", ["task", "project", "idea"]);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    parentTaskId: integer("parent_task_id").references(
      /**
       * If you want to do a self reference, due to a TypeScript limitations you
       * will have to either explicitly set return type for reference callback
       * or use a standalone foreignKey operator.
       * See https://orm.drizzle.team/docs/indexes-constraints#foreign-key
       */
      (): AnyPgColumn => tasks.id,
    ),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    status: taskStatus().notNull().default("todo"),
    type: taskType().notNull().default("task"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
    dueDate: timestamp("due_date"),
  },
  (table) => [
    index("idx_tasks_team_id").on(table.teamId),
    index("idx_tasks_parent_task_id").on(table.parentTaskId),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_comments_task_id").on(table.taskId),
    index("idx_comments_user_id").on(table.userId),
  ],
);

export const files = pgTable(
  "files",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(), // File or folder name
    type: fileType().notNull(), // Could be 'file' or 'folder'
    s3Key: varchar("s3_key", { length: 255 }).notNull().unique(), // S3 key for locating the file in S3
    parentId: integer("parent_id").references((): AnyPgColumn => files.id), // Self-reference for folder hierarchy
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    size: integer("size"), // Size of the file in bytes (null for folders)
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_files_team_id").on(table.teamId),
    index("idx_files_parent_id").on(table.parentId),
  ],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 45 }),
  },
  (table) => [
    index("idx_activity_logs_team_id").on(table.teamId),
    index("idx_activity_logs_user_id").on(table.userId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    email: varchar("email", { length: 255 }).notNull(),
    roleId: pgEnumRole("role")
      .notNull()
      .references(() => roles.id),
    invitedBy: integer("invited_by")
      .notNull()
      .references(() => users.id),
    invitedAt: timestamp("invited_at").notNull().defaultNow(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
  },
  (table) => [
    index("idx_invitations_team_id").on(table.teamId),
    index("idx_invitations_email").on(table.email),
  ],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeProductId: text("stripe_product_id"),
    planName: varchar("plan_name", { length: 50 }),
    subscriptionStatus: varchar("subscription_status", { length: 20 }),
  },
  (table) => [index("idx_teams_stripe_customer_id").on(table.stripeCustomerId)],
);

export const roles = pgTable("roles", {
  id: pgEnumRole("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: pgEnum("name", enumToPgEnum(Perm))().notNull(), // e.g., 'create_task', 'delete_task', 'read_file'
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: serial("id").primaryKey(),
    roleId: pgEnumRole("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("idx_role_permissions_role_id").on(table.roleId),
    index("idx_role_permissions_permission_id").on(table.permissionId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    roleId: pgEnumRole("role_id")
      .notNull()
      .references(() => roles.id),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.teamId),
    index("idx_team_members_user_id").on(table.userId),
    index("idx_team_members_team_id").on(table.teamId),
    index("idx_team_members_role_id").on(table.roleId),
  ],
);

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  role: one(roles, {
    fields: [teamMembers.roleId],
    references: [roles.id],
  }),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  teamMembers: many(teamMembers),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const taskRelations = relations(tasks, ({ one, many }) => ({
  team: one(teams, {
    fields: [tasks.teamId],
    references: [teams.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  }),
  comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const fileRelations = relations(files, ({ one }) => ({
  team: one(teams, {
    fields: [files.teamId],
    references: [teams.id],
  }),
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type SRole = typeof roles.$inferSelect;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, "id" | "name" | "email">;
  } & {
    role: SRole;
  })[] & {};
};
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type TaskType = (typeof taskType.enumValues)[number];
export type TaskStatus = (typeof taskStatus.enumValues)[number];

export enum ActivityType {
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  CREATE_TEAM = "CREATE_TEAM",
  REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
  INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
  ROLE_UPDATE = "ROLE_UPDATE",
}
