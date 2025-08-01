import jsPDF from "jspdf";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  Task,
  MoodEntry,
  getTasksForDateRange,
  getMoodEntriesForDateRange,
} from "./database";

export type ReportPeriod = "week" | "month";

interface ReportData {
  tasks: Task[];
  moodEntries: MoodEntry[];
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
}

export const generateReport = async (
  period: ReportPeriod
): Promise<ReportData> => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === "week") {
    startDate = startOfWeek(now);
    endDate = endOfWeek(now);
  } else {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  const tasks = await getTasksForDateRange(startDate, endDate);
  const moodEntries = await getMoodEntriesForDateRange(startDate, endDate);

  return {
    tasks,
    moodEntries,
    period,
    startDate,
    endDate,
  };
};

export const exportToPDF = async (reportData: ReportData): Promise<void> => {
  const pdf = new jsPDF();
  const { tasks, moodEntries, period, startDate, endDate } = reportData;

  // Title
  pdf.setFontSize(20);
  pdf.text(
    `MindSpace ${period.charAt(0).toUpperCase() + period.slice(1)}ly Report`,
    20,
    30
  );

  // Date range
  pdf.setFontSize(12);
  pdf.text(
    `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`,
    20,
    45
  );

  let yPosition = 65;

  // Task Summary
  pdf.setFontSize(16);
  pdf.text("Task Summary", 20, yPosition);
  yPosition += 10;

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0";

  pdf.setFontSize(12);
  pdf.text(`Total Tasks: ${totalTasks}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Completed: ${completedTasks}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Completion Rate: ${completionRate}%`, 20, yPosition);
  yPosition += 20;

  // Mood Summary
  pdf.setFontSize(16);
  pdf.text("Mood Summary", 20, yPosition);
  yPosition += 10;

  if (moodEntries.length > 0) {
    const avgMood = (
      moodEntries.reduce((sum, entry) => sum + entry.mood, 0) /
      moodEntries.length
    ).toFixed(1);
    const moodLabels = ["", "Very Low", "Low", "Neutral", "Good", "Excellent"];

    pdf.setFontSize(12);
    pdf.text(`Mood Entries: ${moodEntries.length}`, 20, yPosition);
    yPosition += 8;
    pdf.text(
      `Average Mood: ${avgMood}/5 (${
        moodLabels[Math.round(parseFloat(avgMood))]
      })`,
      20,
      yPosition
    );
    yPosition += 20;
  } else {
    pdf.setFontSize(12);
    pdf.text("No mood entries recorded this period", 20, yPosition);
    yPosition += 20;
  }

  // Task Details
  if (tasks.length > 0) {
    pdf.setFontSize(16);
    pdf.text("Task Details", 20, yPosition);
    yPosition += 15;

    tasks.forEach((task) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(10);
      const status = task.completed ? "✓" : "○";
      const dateStr = format(task.createdAt, "MMM dd");
      pdf.text(`${status} ${task.title} (${dateStr})`, 20, yPosition);
      yPosition += 6;

      if (task.description) {
        pdf.setFontSize(8);
        pdf.text(`   ${task.description}`, 25, yPosition);
        yPosition += 6;
      }
      yPosition += 2;
    });
  }

  // Download the PDF
  const filename = `mindspace-${period}-report-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.pdf`;
  pdf.save(filename);
};

export const exportToCSV = async (reportData: ReportData): Promise<void> => {
  const { tasks, moodEntries, period } = reportData;

  let csvContent = "data:text/csv;charset=utf-8,";

  // Tasks section
  csvContent += "TASKS\n";
  csvContent +=
    "Title,Description,Status,Created Date,Completed Date,Priority\n";

  tasks.forEach((task) => {
    const row = [
      `"${task.title}"`,
      `"${task.description || ""}"`,
      task.completed ? "Completed" : "Pending",
      format(task.createdAt, "yyyy-MM-dd"),
      task.completedAt ? format(task.completedAt, "yyyy-MM-dd") : "",
      task.priority,
    ];
    csvContent += row.join(",") + "\n";
  });

  csvContent += "\n";

  // Mood entries section
  csvContent += "MOOD ENTRIES\n";
  csvContent += "Date,Mood (1-5),Note,Emotions\n";

  moodEntries.forEach((entry) => {
    const row = [
      format(entry.date, "yyyy-MM-dd"),
      entry.mood.toString(),
      `"${entry.note || ""}"`,
      `"${entry.emotions.join(", ")}"`,
    ];
    csvContent += row.join(",") + "\n";
  });

  // Download the CSV
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `mindspace-${period}-report-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
