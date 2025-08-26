import { Task } from "@/lib/database";
import { Checkbox } from "@/components/ui/checkbox";


import { Badge, CheckCircle2, Clock, Edit2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { twMerge } from "tailwind-merge";

const priorityTexts = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

interface TasksListProps {
  title: string;
  tasks: Task[];
  handleToggleComplete: (task: Task) => void;
  handleEdit: (task: Task) => void;
  handleDelete: (taskId: number) => Promise<void>;
  completed?: boolean;
}
export function TasksList({
  title,
  tasks,
  handleToggleComplete,
  handleEdit,
  handleDelete,
  completed = false,
}: TasksListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Clock className="h-5 w-5 text-wellness-orange" />
        )}
        {title} ({tasks.length})
      </h3>
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={twMerge(
            completed
              ? "shadow-soft opacity-75"
              : "shadow-soft hover:shadow-wellness transition-all duration-200"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4
                    className={twMerge(
                      "font-medium text-foreground",
                      completed ? "line-through" : ""
                    )}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p
                      className={twMerge(
                        "text-sm text-muted-foreground mt-1",
                        completed ? "line-through" : ""
                      )}
                    >
                      {task.description}
                    </p>
                  )}
                  {!completed && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {priorityTexts[task.priority]}
                      </Badge>
                    </div>
                  )}
                </div>
                {!completed && (
                  <div className="flex items-start gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-4"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(task.id!)}
                      className="size-4 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {completed && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(task.id!)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
