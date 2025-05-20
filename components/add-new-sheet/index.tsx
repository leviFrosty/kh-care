import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  CheckCircle,
  ClipboardList,
  Lightbulb,
  Plus,
  User,
  ChevronDown,
} from "lucide-react";
import { DatePicker } from "@/components/ui/datepicker";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

export function AddNewSheet() {
  const [selected, setSelected] = useState("task");
  const [description, setDescription] = useState("");

  return (
    <div className="p-4 overflow-scroll flex flex-col h-full text-foreground">
      <div>
        {/* Card selector */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${selected === "task" ? "border-primary" : "border-muted"}`}
            onClick={() => setSelected("task")}
          >
            <CheckCircle
              className={`h-7 w-7 ${selected === "task" ? "text-yellow-500" : "text-muted-foreground"}`}
            />
            <span className="font-medium">Task</span>
          </button>
          <button
            className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${selected === "project" ? "border-primary" : "border-muted"}`}
            onClick={() => setSelected("project")}
          >
            <ClipboardList
              className={`h-7 w-7 ${selected === "project" ? "text-yellow-500" : "text-muted-foreground"}`}
            />
            <span className="font-medium">Project</span>
          </button>
          <button
            className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${selected === "idea" ? "border-primary" : "border-muted"}`}
            onClick={() => setSelected("idea")}
          >
            <Lightbulb
              className={`h-7 w-7 ${selected === "idea" ? "text-yellow-500" : "text-muted-foreground"}`}
            />
            <span className="font-medium">Idea</span>
          </button>
        </div>
        {/* Form fields */}
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <Label htmlFor="title" className="text-lg">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Type here"
              className="mt-1 bg-background border-muted text-foreground"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-lg">
              Description
            </Label>
            <div className="mt-1">
              <TiptapEditor
                content={description}
                onChange={setDescription}
                placeholder="Type Description"
                className="bg-background border-muted text-foreground"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="due-date" className="text-lg">
              Due Date
            </Label>
            <div className="mt-1">
              <DatePicker />
            </div>
          </div>
          {/* Admin Settings */}
          <div className="mt-2">
            <div className="text-yellow-500 font-semibold mb-1">
              Admin Settings
            </div>
            <Label htmlFor="system" className="text-base">
              Connect To System
            </Label>
            <div className="relative mt-1">
              <Input
                id="system"
                placeholder="Choose System"
                className="pr-10 bg-background border-muted text-foreground"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <Label htmlFor="assignee" className="text-base">
                Assignee
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-muted text-foreground bg-background"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Input
                  id="assignee"
                  placeholder="Add"
                  className="flex-1 bg-background border-muted text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Create button */}
      </div>
      <Button className="mt-6 w-full bg-primary text-primary-foreground text-lg font-semibold py-6 rounded-xl flex items-center justify-center gap-2">
        <Plus className="h-5 w-5" />
        Create
      </Button>
    </div>
  );
}
