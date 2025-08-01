import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings as SettingsIcon,
  Bell,
  Clock,
  Trash2,
  Download,
  Shield,
} from "lucide-react";
import { db, AppSettings } from "@/lib/database";
import { requestNotificationPermission } from "@/lib/notifications";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [resetTime, setResetTime] = useState("06:00");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] =
    useState<string>("default");

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsArray = await db.settings.toArray();
      if (settingsArray.length > 0) {
        const currentSettings = settingsArray[0];
        setSettings(currentSettings);
        setResetTime(currentSettings.dailyResetTime);
        setNotificationsEnabled(currentSettings.notificationsEnabled);
      }
    } catch (error) {
      console.error("Erro ao carregar as configurações:", error);
    }
  };

  const checkNotificationPermission = () => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (settings) {
        await db.settings.update(settings.id!, {
          dailyResetTime: resetTime,
          notificationsEnabled: notificationsEnabled,
        });
      } else {
        await db.settings.add({
          dailyResetTime: resetTime,
          notificationsEnabled: notificationsEnabled,
          lastTaskReset: new Date(),
        });
      }

      await loadSettings();
      toast("Configurações salvas!", {
        description: "Suas preferências foram atualizadas.",
      });
    } catch (error) {
      toast("Erro", {
        description:
          "Falha ao salvar configurações. Por favor, tente novamente.",
      });
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission("granted");
      setNotificationsEnabled(true);
      toast("Notificações ativadas!", {
        description: "Você agora receberá lembretes úteis.",
      });
    } else {
      toast("Notificações bloqueadas", {
        description: "Você pode ativá-las nas configurações do seu navegador.",
      });
    }
  };

  const handleClearAllData = async () => {
    if (
      window.confirm(
        "Tem certeza? Isso irá deletar TODAS as suas tarefas e entradas de humor. Esta ação não pode ser desfeita."
      )
    ) {
      try {
        await db.tasks.clear();
        await db.moodEntries.clear();

        toast("Dados limpos", {
          description:
            "Todas as suas tarefas e entradas de humor foram deletadas.",
        });
      } catch (error) {
        toast("Erro", {
          description: "Falha ao limpar dados. Por favor, tente novamente.",
        });
      }
    }
  };

  const handleExportData = async () => {
    try {
      const tasks = await db.tasks.toArray();
      const moodEntries = await db.moodEntries.toArray();

      const exportData = {
        exportDate: new Date().toISOString(),
        tasks,
        moodEntries,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `mindspace-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      toast("Dados exportados!", {
        description: "Seu arquivo de backup foi baixado.",
      });
    } catch (error) {
      toast("Falha na exportação", {
        description: "Falha ao exportar dados. Por favor, tente novamente.",
      });
    }
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case "granted":
        return (
          <Badge variant="default" className="bg-success">
            Ativado
          </Badge>
        );
      case "denied":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground">
          Personalize sua experiência no Happy Alice
        </p>
      </div>

      {/* Daily Reset Settings */}
      <Card className="shadow-wellness border-wellness-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-wellness-orange" />
            Redefinição Diária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Hora de Redefinição</label>
            <Input
              type="time"
              value={resetTime}
              onChange={(e) => setResetTime(e.target.value)}
              className="border-wellness-blue/30 focus:border-wellness-blue"
            />
            <p className="text-xs text-muted-foreground">
              As tarefas serão redefinidas automaticamente neste horário todos
              os dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-wellness-purple" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Notificações do Navegador</p>
              <p className="text-xs text-muted-foreground">
                Receba lembretes para tarefas e check-ins de humor
              </p>
            </div>
            {getPermissionBadge()}
          </div>

          {notificationPermission === "default" && (
            <Button
              onClick={handleRequestNotifications}
              variant="outline"
              className="w-full"
            >
              Ativar Notificações
            </Button>
          )}

          {notificationPermission === "granted" && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Ativar lembretes</span>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          )}

          {notificationPermission === "denied" && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                As notificações estão bloqueadas. Para ativá-las, vá para as
                configurações do seu navegador e permita notificações para este
                site.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-wellness-green" />
            Gerenciamento de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Todos os Dados
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Baixe um backup de todas as suas tarefas e entradas de humor
              </p>
            </div>

            <div>
              <Button
                onClick={handleClearAllData}
                variant="destructive"
                className="w-full justify-start gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Todos os Dados
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Isso irá excluir permanentemente todos os seus dados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <Button
            onClick={handleSaveSettings}
            variant="wellness"
            className="w-full"
          >
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            Sobre o Happy Alice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Versão 1.0.0</p>
            <p>
              Um aplicativo da web progressivo para gerenciamento de tarefas
              diárias e rastreamento do bem-estar emocional.
            </p>
            <p>
              Seus dados são armazenados localmente em seu dispositivo e nunca
              compartilhados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
