import { NextResponse } from "next/server";
import {
  getUser,
  createTask,
  getTeamTasks,
  updateTask,
  deleteTask,
} from "@/lib/db/queries";
import { userCanPerformAction } from "@/lib/auth/permissions";
import { Perm } from "@/lib/db/permissions";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { title, description, type, dueDate, teamId } = json;

    if (!title || !teamId) {
      return NextResponse.json(
        { error: "Title and team ID are required" },
        { status: 400 },
      );
    }

    const canCreate = await userCanPerformAction(
      user.id,
      teamId,
      Perm.CREATE_TASK,
    );
    if (!canCreate) {
      return NextResponse.json(
        { error: "You don't have permission to create tasks" },
        { status: 403 },
      );
    }

    const task = await createTask({
      title,
      description,
      type,
      dueDate,
      teamId,
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Error creating task" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 },
      );
    }

    const canRead = await userCanPerformAction(
      user.id,
      parseInt(teamId),
      Perm.READ_TASK,
    );
    if (!canRead) {
      return NextResponse.json(
        { error: "You don't have permission to read tasks" },
        { status: 403 },
      );
    }

    const taskList = await getTeamTasks(parseInt(teamId));
    return NextResponse.json(taskList);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { id, teamId, ...updateData } = json;

    if (!id || !teamId) {
      return NextResponse.json(
        { error: "Task ID and team ID are required" },
        { status: 400 },
      );
    }

    const canUpdate = await userCanPerformAction(
      user.id,
      teamId,
      Perm.UPDATE_TASK,
    );
    if (!canUpdate) {
      return NextResponse.json(
        { error: "You don't have permission to update tasks" },
        { status: 403 },
      );
    }

    const task = await updateTask(id, updateData);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Error updating task" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const teamId = searchParams.get("teamId");

    if (!id || !teamId) {
      return NextResponse.json(
        { error: "Task ID and team ID are required" },
        { status: 400 },
      );
    }

    const canDelete = await userCanPerformAction(
      user.id,
      parseInt(teamId),
      Perm.DELETE_TASK,
    );
    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete tasks" },
        { status: 403 },
      );
    }

    await deleteTask(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Error deleting task" }, { status: 500 });
  }
}
