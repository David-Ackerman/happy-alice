import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Task,
  getTodaysTasks,
  updateTask,
  addTask,
  deleteTask,
} from "@/lib/database";
import { scheduleTaskReminder } from "@/lib/notifications";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Clock, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

const priorityTexts = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

function RouteComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id!, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        });
        toast("Tarefa atualizada", {
          description: "Sua tarefa foi atualizada com sucesso.",
        });
      } else {
        await addTask({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          completed: false,
        });
        toast("Tarefa adicionada", {
          description: "Sua nova tarefa foi adicionada.",
        });

        // Schedule reminder for high priority tasks
        if (formData.priority === "high") {
          scheduleTaskReminder(formData.title, 30);
        }
      }

      resetForm();
      loadTasks();
    } catch (error) {
      toast("Erro", {
        description: "Falha ao salvar tarefa. Por favor, tente novamente.",
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
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

  const resetForm = () => {
    setFormData({ title: "", description: "", priority: "medium" });
    setEditingTask(null);
    setShowForm(false);
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
        <Card className="shadow-wellness border-wellness-blue/20">
          <CardHeader>
            <CardTitle>
              {editingTask ? "Editar tarefa" : "Adicionar nova tarefa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Título da tarefa"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-wellness-blue/30 focus:border-wellness-blue"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-wellness-blue/30 focus:border-wellness-blue"
              />
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: value as "low" | "medium" | "high",
                  })
                }
              >
                <SelectTrigger className="border-wellness-blue/30">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa Prioridade</SelectItem>
                  <SelectItem value="medium">Média Prioridade</SelectItem>
                  <SelectItem value="high">Alta Prioridade</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button type="submit" variant="wellness">
                  {editingTask ? "Atualizar" : "Adicionar"} Tarefa
                </Button>
                <Button
                  className="flex-1"
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-wellness-orange" />
            Pendentes ({pendingTasks.length})
          </h3>
          {pendingTasks.map((task) => (
            <Card
              key={task.id}
              className="shadow-soft hover:shadow-wellness transition-all duration-200"
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
                      <h4 className="font-medium text-foreground">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {priorityTexts[task.priority]}
                        </Badge>
                      </div>
                    </div>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Completadas ({completedTasks.length})
          </h3>
          {completedTasks.map((task) => (
            <Card key={task.id} className="shadow-soft opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleComplete(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground line-through">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-through">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(task.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
