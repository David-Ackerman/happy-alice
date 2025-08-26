import { db, getRecurrentTasksForToday } from "./database";
import { format, isAfter, parseISO } from "date-fns";

export const checkAndResetTasks = async (): Promise<boolean> => {
  try {
    const settings = await db.settings.toArray();
    if (settings.length === 0) return false;

    const { dailyResetTime, lastTaskReset } = settings[0];
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const resetDateTime = parseISO(`${today}T${dailyResetTime}:00`);

    // Check if we've passed the reset time and haven't reset today
    const lastResetDate = format(lastTaskReset, "yyyy-MM-dd");
    const shouldReset = isAfter(now, resetDateTime) && lastResetDate !== today;

    if (shouldReset) {
      // Clear completed tasks from previous days
      const completedTasks = await db.tasks
        .where("completed")
        .equals(1)
        .toArray();
      const tasksToDelete = completedTasks.filter(
        (task) => format(task.createdAt, "yyyy-MM-dd") !== today
      );

      for (const task of tasksToDelete) {
        await db.tasks.delete(task.id!);
      }

      // Reset pending tasks to incomplete
      const pendingTasks = await db.tasks
        .where("completed")
        .equals(0)
        .toArray();
      for (const task of pendingTasks) {
        await db.tasks.update(task.id!, {
          completed: false,
          completedAt: undefined,
        });
      }

      // Create today's instance of recurrent tasks if not already present
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const recurrentTasks = await getRecurrentTasksForToday();
      for (const recTask of recurrentTasks) {
        // Check if a task with same title and today exists
        const exists = await db.tasks
          .where({ title: recTask.title, createdAt: todayDate })
          .first();
        if (!exists) {
          await db.tasks.add({
            ...recTask,
            id: undefined,
            createdAt: todayDate,
            completed: false,
          });
        }
      }

      // Update last reset time
      await db.settings.update(settings[0].id!, { lastTaskReset: now });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error during task reset:", error);
    return false;
  }
};
