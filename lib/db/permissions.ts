import { z } from "zod";

export enum Perm {
  CREATE_TASK = "create_task",
  READ_TASK = "read_task",
  UPDATE_TASK = "update_task",
  DELETE_TASK = "delete_task",

  CREATE_FILE = "create_file",
  READ_FILE = "read_file",
  UPDATE_FILE = "update_file",
  DELETE_FILE = "delete_file",

  INVITE_USER = "invite_user",
  REMOVE_USER = "remove_user",
  SET_USER_PERMISSIONS = "set_user_permissions",
}
export enum Role {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export const RoleStrings: Record<Role, string> = {
  [Role.OWNER]: "Owner",
  [Role.ADMIN]: "Admin",
  [Role.MEMBER]: "Member",
};

export const RoleSchema = z.nativeEnum(Role);
