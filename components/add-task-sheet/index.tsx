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
import { toast } from "sonner";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["task", "project", "idea"] as const),
  dueDate: z.date().optional(),
  teamId: z.number(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface AddTaskSheetProps {
  teamId: number;
  onClose?: () => void;
}

export function AddTaskSheet({ teamId, onClose }: AddTaskSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "task",
      teamId,
    },
  });

  async function onSubmit(data: TaskFormValues) {
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
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${field.value === "task" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("task")}
                  >
                    <CheckCircle
                      className={`h-7 w-7 ${field.value === "task" ? "text-yellow-500" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">Task</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${field.value === "project" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("project")}
                  >
                    <ClipboardList
                      className={`h-7 w-7 ${field.value === "project" ? "text-yellow-500" : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">Project</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center border rounded-xl px-6 py-5 gap-2 w-28 ${field.value === "idea" ? "border-primary" : "border-muted"}`}
                    onClick={() => field.onChange("idea")}
                  >
                    <Lightbulb
                      className={`h-7 w-7 ${field.value === "idea" ? "text-yellow-500" : "text-muted-foreground"}`}
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
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Type Description"
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
                    <DatePicker value={field.value} onChange={field.onChange} />
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
                    type="button"
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
