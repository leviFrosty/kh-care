import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import {
  users,
  teams,
  teamMembers,
  teamRoles,
  roles,
  permissions,
  User,
  Team,
  RoleName,
  TeamMember,
  TeamRole,
  Permission,
  RolePermission,
  rolePermissions,
  Role,
  Perm,
} from "./schema";
import { hashPassword } from "@/lib/auth/session";

async function createStripeProducts() {
  console.log("Creating Stripe products and prices...");

  const products = await stripe.products.list();
  const prices = await stripe.prices.list();
  if (products.data.length > 0 && prices.data.length > 0) {
    console.log("Stripe products and prices already exist.");
    return;
  }

  const baseProduct = await stripe.products.create({
    name: "Base",
    description: "Base subscription plan",
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: "Plus",
    description: "Plus subscription plan",
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  console.log("Stripe products and prices created successfully.");
}

async function seedUser(): Promise<User> {
  const email = "test@test.com";
  const password = "admin123";
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
      },
    ])
    .returning();

  console.log("Initial user created.");
  return user;
}

async function seedTeam(): Promise<Team> {
  const [team] = await db
    .insert(teams)
    .values({
      name: "Test Team",
    })
    .returning();

  console.log("Initial team created.");
  return team;
}

async function seedRoles(): Promise<Role[]> {
  const addedRoles = await db
    .insert(roles)
    .values([
      { name: RoleName.OWNER },
      { name: RoleName.ADMIN },
      { name: RoleName.MEMBER },
    ])
    .returning();

  console.log("Added roles.");
  return addedRoles;
}

async function seedTeamRoles(
  roles: Role[],
  teamId: number,
  userId: number
): Promise<TeamRole[]> {
  const addedTeamRoles = await db
    .insert(teamRoles)
    .values({
      userId,
      teamId,
      roleId: roles[0].id, // owner role for example user
    })
    .returning();

  console.log("Added team roles.");
  return addedTeamRoles;
}

async function seedTeamMembers(team: Team, user: User): Promise<TeamMember[]> {
  const [teamMember] = await db.insert(teamMembers).values({
    userId: user.id,
    teamId: team.id,
  });

  console.log("Team member created.");
  return [teamMember];
}

async function seedPermissions(): Promise<Permission[]> {
  const perms = await db
    .insert(permissions)
    .values(
      Object.values(Perm).map((name) => ({
        name,
      }))
    )
    .returning();

  console.log("All available permissions created.");
  return perms;
}

function exampleMemberPermissions(perms: Permission[]) {}

async function seedRolePermissions(
  roles: Role[],
  perms: Permission[]
): Promise<RolePermission[]> {
  const ownerRole = roles.find((role) => role.name === RoleName.OWNER);
  if (!ownerRole) {
    throw new Error("Owner role not found");
  }
  const rolePerms = await db.insert(rolePermissions).values(
    perms.map((perm) => ({
      roleId: ownerRole.id,
      permissionId: perm.id,
    }))
  );
  const adminRole = roles.find((role) => role.name === RoleName.ADMIN);
  if (!adminRole) {
    throw new Error("Admin role not found");
  }
  const adminPerms = perms.filter(
    (perm) => perm.name !== Perm.SET_USER_PERMISSIONS
  );
  await db.insert(rolePermissions).values(
    adminPerms.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    }))
  );

  const isMemberPerm = (perm: Perm) => {
    switch (perm) {
      case Perm.CREATE_FILE:
      case Perm.CREATE_TASK:
      case Perm.READ_FILE:
      case Perm.READ_TASK:
        return true;
      default:
        return false;
    }
  };

  const memberRole = roles.find((role) => role.name === RoleName.MEMBER);
  if (!memberRole) {
    throw new Error("Member role not found");
  }
  const memberPerms = perms.filter((perm) => isMemberPerm(perm.name));
  await db.insert(rolePermissions).values(
    memberPerms.map((perm) => ({
      roleId: memberRole.id,
      permissionId: perm.id,
    }))
  );
  console.log("Role permissions created.");
  return rolePerms;
}

async function seed() {
  const user = await seedUser();
  const team = await seedTeam();
  const roles = await seedRoles();
  await seedTeamRoles(roles, team.id, user.id);
  await seedTeamMembers(team, user);
  const perms = await seedPermissions();
  await seedRolePermissions(roles, perms);
  await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error("Seed process failed:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed process finished. Exiting...");
    process.exit(0);
  });
