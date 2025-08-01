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
}

export interface MoodEntry {
  id?: number;
  date: Date;
  mood: number; // 1-5 scale
  note?: string;
  emotions: string[]; // Array of emotion tags
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

  constructor() {
    super("MindSpaceDB");
    this.version(1).stores({
      tasks: "++id, title, completed, createdAt, dueDate, priority",
      moodEntries: "++id, date, mood",
      settings: "++id, dailyResetTime, notificationsEnabled, lastTaskReset",
    });
  }
}

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

  return await db.tasks.where("createdAt").above(today).toArray();
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
