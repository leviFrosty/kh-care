"use client";

import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface KanbanColumnHeaderProps {
  title: string;
  onEdit: () => void;
}

export function KanbanColumnHeader({ title, onEdit }: KanbanColumnHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
