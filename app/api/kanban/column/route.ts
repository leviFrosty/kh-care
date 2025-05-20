import { NextRequest, NextResponse } from "next/server";
import { getTeamForUser, createKanbanColumn } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const column = await createKanbanColumn({
      teamId: team.id,
      name: data.name,
      order: data.order,
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error("Error creating kanban column:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
