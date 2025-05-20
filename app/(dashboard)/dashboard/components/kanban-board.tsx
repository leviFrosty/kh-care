"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanColumn, Task } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { KanbanTask } from "./kanban-task";
import { KanbanColumnHeader } from "./kanban-column-header";

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export function KanbanBoard({ columns: initialColumns }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id);
    const overTask = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === over.id);

    if (!activeTask || !overTask) return;

    const activeColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === active.id),
    );
    const overColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === over.id),
    );

    if (!activeColumn || !overColumn) return;

    if (activeColumn !== overColumn) {
      // Move task to different column
      setColumns((columns) =>
        columns.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== activeTask.id),
            };
          }
          if (col.id === overColumn.id) {
            return {
              ...col,
              tasks: [...col.tasks, activeTask],
            };
          }
          return col;
        }),
      );

      // Update in database
      await fetch(`/api/task`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeTask.id,
          teamId: activeColumn.teamId,
          columnId: overColumn.id,
          order: overColumn.tasks.length,
        }),
      });
    } else {
      // Reorder within same column
      setColumns((columns) =>
        columns.map((col) => {
          if (col.id === activeColumn.id) {
            const oldIndex = col.tasks.findIndex((t) => t.id === activeTask.id);
            const newIndex = col.tasks.findIndex((t) => t.id === overTask.id);
            return {
              ...col,
              tasks: arrayMove(col.tasks, oldIndex, newIndex),
            };
          }
          return col;
        }),
      );

      // Update order in database
      await fetch(`/api/task`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeTask.id,
          teamId: activeColumn.teamId,
          order: overColumn.tasks.findIndex((t) => t.id === overTask.id),
        }),
      });
    }
  };

  const handleAddColumn = async () => {
    const response = await fetch("/api/kanban/column", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Column",
        teamId: columns[0]?.teamId,
      }),
    });

    if (response.ok) {
      const newColumn = await response.json();
      setColumns([...columns, { ...newColumn, tasks: [] }]);
      setEditingColumn(newColumn.id.toString());
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    const response = await fetch(`/api/kanban/column/${columnId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setColumns(columns.filter((col) => col.id !== columnId));
    }
  };

  const handleUpdateColumnName = async (columnId: number, name: string) => {
    const response = await fetch(`/api/kanban/column/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      setColumns(
        columns.map((col) => (col.id === columnId ? { ...col, name } : col)),
      );
      setEditingColumn(null);
    }
  };

  return (
    <div className="flex-1">
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <Card key={column.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                {editingColumn === column.id.toString() ? (
                  <Input
                    defaultValue={column.name}
                    onBlur={(e) =>
                      handleUpdateColumnName(column.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateColumnName(
                          column.id,
                          e.currentTarget.value,
                        );
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <KanbanColumnHeader
                    title={column.name}
                    onEdit={() => setEditingColumn(column.id.toString())}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteColumn(column.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <SortableContext
                  items={column.tasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {column.tasks.map((task) => (
                      <KanbanTask key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanTask task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
