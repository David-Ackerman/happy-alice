export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if (Notification.permission === "granted") {
    return new Notification(title, {
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      ...options,
    });
  }
};

export const scheduleTaskReminder = (
  taskTitle: string,
  delayMinutes: number = 30
) => {
  setTimeout(() => {
    showNotification("Task Reminder", {
      body: `Don't forget: ${taskTitle}`,
      tag: "task-reminder",
    });
  }, delayMinutes * 60 * 1000);
};

export const showDailyMoodReminder = () => {
  showNotification("How are you feeling today?", {
    body: "Take a moment to record your mood and thoughts",
    tag: "mood-reminder",
  });
};
