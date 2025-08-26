import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@radix-ui/react-select";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { updateTask, addTask, Task } from "@/lib/database";
import { scheduleTaskReminder } from "@/lib/notifications";
import { toast } from "sonner";
import { TaskFormData } from "@/routes";
import { Checkbox } from "./ui/checkbox";
import WeekdayPicker from "./ui/weekday-picker";

export function TaskForm({
  editingTask,
  setEditingTask,
  setShowForm,
  loadTasks,
  formData,
  setFormData,
}: {
  editingTask: Task | null;
  setEditingTask: (val: Task | null) => void;
  setShowForm: (val: boolean) => void;
  loadTasks: () => void;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
}) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id!, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          isRecurrent: formData.isRecurrent ?? false,
          recurrenceDays: formData.isRecurrent
            ? formData.recurrenceDays
            : undefined,
          recurrenceEndDate:
            formData.isRecurrent && formData.recurrenceEndDate
              ? new Date(formData.recurrenceEndDate)
              : undefined,
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
          isRecurrent: formData.isRecurrent ?? false,
          recurrenceDays: formData.isRecurrent
            ? formData.recurrenceDays
            : undefined,
          recurrenceEndDate:
            formData.isRecurrent && formData.recurrenceEndDate
              ? new Date(formData.recurrenceEndDate)
              : undefined,
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
    } catch {
      toast("Erro", {
        description: "Falha ao salvar tarefa. Por favor, tente novamente.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      isRecurrent: false,
      recurrenceDays: [],
      recurrenceEndDate: undefined,
    });
    setEditingTask(null);
    setShowForm(false);
  };

  return (
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
          {/* Recurrence UI */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!formData.isRecurrent}
              onCheckedChange={(v) =>
                setFormData({
                  ...formData,
                  isRecurrent: !!v,
                  recurrenceDays: v ? formData.recurrenceDays ?? [] : [],
                  recurrenceEndDate: v ? formData.recurrenceEndDate : undefined,
                })
              }
              id="isRecurrent"
            />
            <label htmlFor="isRecurrent">Tarefa recorrente</label>
          </div>
          {formData.isRecurrent && (
            <div className="flex flex-col gap-2">
              <WeekdayPicker
                value={formData.recurrenceDays ?? []}
                onChange={(days) =>
                  setFormData({ ...formData, recurrenceDays: days })
                }
              />
              <div className="flex items-center gap-2">
                <label htmlFor="recurrenceEndDate">Até (opcional):</label>
                <input
                  type="date"
                  id="recurrenceEndDate"
                  value={formData.recurrenceEndDate ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrenceEndDate: e.target.value || undefined,
                    })
                  }
                  className="border rounded px-2 py-1"
                />
              </div>
            </div>
          )}
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
  );
}
