import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function execCommand(command: string, ignoreError = false) {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    if (!ignoreError) {
      console.error(`Failed to execute command: ${command}`);
      console.error(error);
      process.exit(1);
    }
    throw error;
  }
}

async function isContainerRunning() {
  try {
    await execCommand(
      "docker ps --filter name=next_saas_starter_postgres --format '{{.Status}}'",
    );
    return true;
  } catch (error) {
    return false;
  }
}

async function waitForPostgres() {
  console.log("⏳ Waiting for PostgreSQL to be ready...");
  let retries = 30;
  while (retries > 0) {
    try {
      // First check if container is running
      if (!(await isContainerRunning())) {
        console.log("Container not yet running, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Then check if PostgreSQL is accepting connections
      await execCommand(
        "docker exec next_saas_starter_postgres pg_isready -U postgres",
        true,
      );
      console.log("✅ PostgreSQL is ready!");
      return true;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error("Failed to connect to PostgreSQL after 30 attempts");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function resetDatabase() {
  console.log("🗑️  Cleaning up existing containers...");
  await execCommand("docker-compose down -v");

  console.log("🐳 Starting database container...");
  await execCommand("docker-compose up -d");

  // Wait for container to be healthy
  await waitForPostgres();

  // Additional wait to ensure PostgreSQL is fully ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("📦 Pushing schema to database...");
  await execCommand("pnpm db:push");

  console.log("🌱 Seeding database...");
  await execCommand("pnpm db:seed");

  console.log("✨ Database reset complete!");
}

resetDatabase().catch((error) => {
  console.error("Failed to reset database:", error);
  process.exit(1);
});
