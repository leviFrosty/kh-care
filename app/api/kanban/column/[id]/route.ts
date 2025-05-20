import { NextRequest, NextResponse } from "next/server";
import {
  getTeamForUser,
  updateKanbanColumn,
  deleteKanbanColumn,
} from "@/lib/db/queries";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const columnId = parseInt(params.id);
    if (isNaN(columnId)) {
      return new NextResponse("Invalid column ID", { status: 400 });
    }

    const data = await request.json();
    const column = await updateKanbanColumn(columnId, data);

    return NextResponse.json(column);
  } catch (error) {
    console.error("Error updating kanban column:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const columnId = parseInt(params.id);
    if (isNaN(columnId)) {
      return new NextResponse("Invalid column ID", { status: 400 });
    }

    await deleteKanbanColumn(columnId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting kanban column:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
