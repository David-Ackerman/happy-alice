import { TaskForm } from "@/components/task-form";
import { TasksList } from "@/components/tasks-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Task,
  addTask,
  deleteTask,
  getTodaysTasks,
  updateTask,
} from "@/lib/database";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

export interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  isRecurrent?: boolean;
  recurrenceDays?: number[];
  recurrenceEndDate?: string; // ISO string for date picker
}

function RouteComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState<TaskFormData>({
    description: editingTask?.description ?? "",
    priority: editingTask?.priority ?? "low",
    title: editingTask?.title ?? "",
    isRecurrent: editingTask?.isRecurrent ?? false,
    recurrenceDays: editingTask?.recurrenceDays ?? [],
    recurrenceEndDate: editingTask?.recurrenceEndDate
      ? new Date(editingTask.recurrenceEndDate).toISOString().slice(0, 10)
      : undefined,
  });
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const todaysTasks = await getTodaysTasks();
      setTasks(todaysTasks);
    } catch (error) {
      toast("Erro ao carregar tarefas", {
        description:
          "Falha ao carregar suas tarefas. Por favor, tente novamente.",
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      // If this is a virtual recurrent task (no id), create a real instance for today
      if (!task.id && task.isRecurrent) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Create a new task instance for today
        await addTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          completed: true,
          completedAt: new Date(),
          isRecurrent: true,
          recurrenceDays: task.recurrenceDays,
          recurrenceEndDate: task.recurrenceEndDate,
        });
        loadTasks();
        toast("Muito bem! 🎉", {
          description: `Você completou "${task.title}"`,
        });
        return;
      }
      // Otherwise, update normally
      const updates: Partial<Task> = {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined,
      };
      await updateTask(task.id!, updates);
      loadTasks();
      if (!task.completed) {
        toast("Muito bem! 🎉", {
          description: `Você completou "${task.title}"`,
        });
      }
    } catch (error) {
      toast("Erro", {
        description: "Falha ao atualizar status da tarefa.",
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
    });
    setShowForm(true);
  };

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      loadTasks();
      toast("Tarefa excluída", {
        description: "A tarefa foi removida.",
      });
    } catch (error) {
      toast("Erro", {
        description: "Falha ao excluir tarefa.",
      });
    }
  };

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Tarefas de Hoje
          </h2>
          <p className="text-muted-foreground">
            {completedTasks.length} de {tasks.length} completadas
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="wellness"
            className="gap-2 px-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Tarefa
          </Button>
        )}
      </div>

      {/* Progress indicator */}
      {tasks.length > 0 && (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-gradient-wellness h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(completedTasks.length / tasks.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Task Form */}
      {showForm && (
        <TaskForm
          formData={formData}
          loadTasks={loadTasks}
          setEditingTask={setEditingTask}
          setFormData={setFormData}
          setShowForm={setShowForm}
          editingTask={editingTask}
        />
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <TasksList
          title="Pendentes"
          tasks={pendingTasks}
          handleToggleComplete={handleToggleComplete}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <TasksList
          title="Completadas"
          tasks={completedTasks}
          handleToggleComplete={handleToggleComplete}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          completed
        />
      )}

      {tasks.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhuma tarefa ainda</p>
              <p className="text-sm">
                Adicione sua primeira tarefa para começar a planejar seu dia!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
