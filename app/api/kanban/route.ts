import { NextResponse } from "next/server";
import { getTeamForUser, getTeamKanbanData } from "@/lib/db/queries";

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const columns = await getTeamKanbanData(team.id);
    return NextResponse.json(columns);
  } catch (error) {
    console.error("Error fetching kanban data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
