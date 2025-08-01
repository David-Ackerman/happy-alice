import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, TrendingUp, Calendar, Heart } from "lucide-react";
import {
  generateReport,
  exportToPDF,
  exportToCSV,
  ReportPeriod,
} from "@/lib/export";

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("week");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const data = await generateReport(selectedPeriod);
      setReportData(data);

      toast("Relatório gerado!", {
        description: `Seu relatório ${selectedPeriod}al está pronto para exportação.`,
      });
    } catch (error) {
      toast("Erro", {
        description: "Falha ao gerar relatório. Por favor, tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    try {
      await exportToPDF(reportData);
      toast("PDF exportado!", {
        description: "Seu relatório foi baixado como um arquivo PDF.",
      });
    } catch (error) {
      toast("Falha na exportação", {
        description: "Falha ao exportar PDF. Por favor, tente novamente.",
      });
    }
  };

  const handleExportCSV = async () => {
    if (!reportData) return;

    try {
      await exportToCSV(reportData);
      toast("CSV exportado!", {
        description: "Seu relatório foi baixado como um arquivo CSV.",
      });
    } catch (error) {
      toast("Falha na exportação", {
        description: "Falha ao exportar CSV. Por favor, tente novamente.",
      });
    }
  };

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    if (period === "week") {
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };
    } else {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    }
  };

  const dateRange = getDateRange(selectedPeriod);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Relatórios & Análises
        </h2>
        <p className="text-muted-foreground">
          Exporte seu progresso e insights para acompanhar sua jornada
        </p>
      </div>

      <Card className="shadow-wellness border-wellness-blue/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-wellness-purple" />
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período do Relatório</label>
            <Select
              value={selectedPeriod}
              onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}
            >
              <SelectTrigger className="border-wellness-blue/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.start, "MMM dd")} -{" "}
              {format(dateRange.end, "MMM dd, yyyy")}
            </p>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            variant="wellness"
            className="w-full"
          >
            {isGenerating
              ? "Gerando..."
              : `Gerar Relatório ${
                  selectedPeriod.charAt(0).toUpperCase() +
                  selectedPeriod.slice(1)
                }ly`}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Report Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Resumo do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Stats */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-wellness-blue" />
                    <h3 className="font-semibold">Desempenho das Tarefas</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Tarefas totais
                      </span>
                      <Badge variant="outline">{reportData.tasks.length}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Concluídas
                      </span>
                      <Badge variant="default" className="bg-success">
                        {
                          reportData.tasks.filter((t: any) => t.completed)
                            .length
                        }
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Taxa de Conclusão
                      </span>
                      <Badge variant="outline">
                        {reportData.tasks.length > 0
                          ? `${Math.round(
                              (reportData.tasks.filter((t: any) => t.completed)
                                .length /
                                reportData.tasks.length) *
                                100
                            )}%`
                          : "0%"}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {reportData.tasks.length > 0 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-gradient-wellness h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (reportData.tasks.filter((t: any) => t.completed)
                              .length /
                              reportData.tasks.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mood Stats */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-wellness-purple" />
                    <h3 className="font-semibold">Insights de Bem-Estar</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Entradas de Humor
                      </span>
                      <Badge variant="outline">
                        {reportData.moodEntries.length}
                      </Badge>
                    </div>

                    {reportData.moodEntries.length > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Humor Médio
                          </span>
                          <Badge
                            variant="default"
                            className="bg-wellness-purple"
                          >
                            {(
                              reportData.moodEntries.reduce(
                                (sum: number, entry: any) => sum + entry.mood,
                                0
                              ) / reportData.moodEntries.length
                            ).toFixed(1)}
                            /5
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Melhor Dia
                          </span>
                          <Badge variant="outline" className="text-success">
                            {Math.max(
                              ...reportData.moodEntries.map(
                                (entry: any) => entry.mood
                              )
                            )}
                            /5
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-wellness-green" />
                Exportar Opções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Relatório PDF</h4>
                  <p className="text-sm text-muted-foreground">
                    Relatório formatado de forma bonita, perfeito para
                    compartilhar ou imprimir
                  </p>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar como PDF
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Dados CSV</h4>
                  <p className="text-sm text-muted-foreground">
                    Arquivo de dados brutos para análise adicional em
                    aplicativos de planilhas
                  </p>
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar como CSV
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Dica:</strong> Relatórios PDF são ótimos para
                  compartilhar com profissionais de saúde ou manter registros
                  pessoais. Arquivos CSV funcionam bem com aplicativos como
                  Numbers (iOS) ou Google Sheets para análises mais profundas.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Gere seu primeiro relatório</p>
              <p className="text-sm">
                Selecione um período de tempo acima e gere um relatório para ver
                seu progresso e exportar seus dados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
