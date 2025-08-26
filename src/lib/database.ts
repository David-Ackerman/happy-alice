import Dexie, { Table } from "dexie";

export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  isRecurrent?: boolean;
  recurrenceDays?: number[]; // 0 (Sunday) - 6 (Saturday)
  recurrenceEndDate?: Date; // Optional: when recurrence should stop
}

export interface MoodEntry {
  id?: number;
  date: Date;
  mood: number; // 1-5 scale
  note?: string;
  emotions: string[]; // Array of emotion tags
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number; // epoch ms
}

export interface ChatDay {
  id?: number;
  date: string; // yyyy-MM-dd
  messages: ChatMessage[];
}

export interface AppSettings {
  id?: number;
  dailyResetTime: string; // Format: "HH:mm"
  notificationsEnabled: boolean;
  lastTaskReset: Date;
}

export class MindSpaceDB extends Dexie {
  tasks!: Table<Task>;
  moodEntries!: Table<MoodEntry>;
  settings!: Table<AppSettings>;
  chats!: Table<ChatDay>;

  constructor() {
    super("MindSpaceDB");
    this.version(1).stores({
      tasks:
        "++id, title, completed, createdAt, dueDate, priority, isRecurrent, recurrenceDays, recurrenceEndDate",
      moodEntries: "++id, date, mood",
      settings: "++id, dailyResetTime, notificationsEnabled, lastTaskReset",
    });

    // Add chats store in version 2
    this.version(2).stores({
      chats: "++id, date",
    });
  }
}

// Helper to get all recurrent tasks for today
export const getRecurrentTasksForToday = async (): Promise<Task[]> => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  today.setHours(0, 0, 0, 0);
  // Only get tasks that are recurrent, have today in recurrenceDays, and are not ended
  const allRecurrent = await db.tasks.where("isRecurrent").equals(1).toArray();
  return allRecurrent.filter((task) => {
    if (!task.recurrenceDays?.includes(dayOfWeek)) return false;
    if (task.recurrenceEndDate && today > new Date(task.recurrenceEndDate))
      return false;
    return true;
  });
};

export const db = new MindSpaceDB();

// Initialize default settings
export const initializeApp = async () => {
  const existingSettings = await db.settings.toArray();
  if (existingSettings.length === 0) {
    await db.settings.add({
      dailyResetTime: "06:00",
      notificationsEnabled: true,
      lastTaskReset: new Date(),
    });
  }
};

// Helper functions
export const getTodaysTasks = async (): Promise<Task[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Get normal tasks
  const normalTasks = await db.tasks.where("createdAt").above(today).toArray();
  // Get recurrent tasks for today
  const recurrentTasks = await getRecurrentTasksForToday();
  // Merge, but avoid duplicates (if a recurrent task was already created today, don't add again)
  const allTasks = [...normalTasks];
  for (const recTask of recurrentTasks) {
    // Check if a task with same title and today exists
    const exists = normalTasks.some(
      (t) => t.title === recTask.title && t.createdAt >= today
    );
    if (!exists) {
      // Clone recurrent task as today's instance (not saved in DB, just for display)
      allTasks.push({
        ...recTask,
        id: undefined,
        createdAt: today,
        completed: false,
      });
    }
  }
  return allTasks;
};

export const getTodaysMoodEntry = async (): Promise<MoodEntry | undefined> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db.moodEntries.where("date").between(today, tomorrow).first();
};

export const addTask = async (task: Omit<Task, "id" | "createdAt">) => {
  return await db.tasks.add({
    ...task,
    createdAt: new Date(),
  });
};

export const updateTask = async (id: number, updates: Partial<Task>) => {
  return await db.tasks.update(id, updates);
};

export const deleteTask = async (id: number) => {
  return await db.tasks.delete(id);
};

export const addMoodEntry = async (mood: Omit<MoodEntry, "id" | "date">) => {
  return await db.moodEntries.add({
    ...mood,
    date: new Date(),
  });
};

export const getTasksForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Task[]> => {
  return await db.tasks
    .where("createdAt")
    .between(startDate, endDate)
    .toArray();
};

export const getMoodEntriesForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<MoodEntry[]> => {
  return await db.moodEntries
    .where("date")
    .between(startDate, endDate)
    .toArray();
};
