import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  ClipboardList,
  Lightbulb,
  Plus,
  ChevronDown,
  Loader2,
  User,
} from "lucide-react";
import { DatePicker } from "@/components/ui/datepicker";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { NewTask, TeamDataWithMembers, taskType } from "@/lib/db/schema";

// Create a type that omits auto-generated fields from NewTask
type TaskFormData = Omit<
  NewTask,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "parentTaskId"
>;

interface AddTaskSheetProps {
  team: TeamDataWithMembers;
  defaultColumnId: number;
  onClose?: () => void;
}

export function AddTaskSheet({
  team,
  defaultColumnId,
  onClose,
}: AddTaskSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      description: null,
      type: "task",
      teamId: team.id,
      columnId: defaultColumnId,
      order: 0, // New tasks are added at the start
      assigneeId: null,
      dueDate: null,
    },
  });

  async function onSubmit(data: TaskFormData) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      toast.success("Task created successfully");
      router.refresh();
      onClose?.();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-4 overflow-scroll flex flex-col h-full text-foreground"
      >
        <div>
          {/* Card selector */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-4 justify-center mb-6">
                  <button
                    type="button"
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 transition-all duration-200 ${field.value === "task" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("task")}
                  >
                    <CheckCircle
                      className={`h-7 w-7 transition-colors duration-200 ${field.value === "task" ? "text-yellow-500" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">Task</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 transition-all duration-200 ${field.value === "project" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("project")}
                  >
                    <ClipboardList
                      className={`h-7 w-7 transition-colors duration-200 ${field.value === "project" ? "text-yellow-500" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">Project</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 transition-all duration-200 ${field.value === "idea" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("idea")}
                  >
                    <Lightbulb
                      className={`h-7 w-7 transition-colors duration-200 ${field.value === "idea" ? "text-yellow-500" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">Idea</span>
                  </button>
                </div>
              </FormItem>
            )}
          />

          {/* Form fields */}
          <div className="flex flex-col gap-4 flex-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Type here"
                      className="mt-1 bg-background border-muted text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Description</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      content={field.value || ""}
                      onChange={field.onChange}
                      className="bg-background border-muted text-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Due Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value || undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Settings */}
            <div className="mt-2">
              <div className="text-yellow-500 font-semibold mb-1">
                Admin Settings
              </div>
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Assignee</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-background border-muted text-foreground">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {team.teamMembers.map((member) => (
                          <SelectItem
                            key={member.user.id}
                            value={member.user.id.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>
                                {member.user.name || member.user.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <Button
          type="submit"
          className="mt-6 w-full bg-primary text-primary-foreground text-lg font-semibold py-6 rounded-xl flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </form>
    </Form>
  );
}
