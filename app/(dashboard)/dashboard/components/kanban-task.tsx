"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface KanbanTaskProps {
  task: Task;
}

export function KanbanTask({ task }: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{task.title}</h3>
            {task.assigneeId && (
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {task.assigneeId.toString()[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {task.description}
            </p>
          )}
          {task.dueDate && (
            <p className="text-xs text-muted-foreground mt-2">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
