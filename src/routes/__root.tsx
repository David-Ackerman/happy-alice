import { Navigation } from "@/components/navigation";
import { initializeApp } from "@/lib/database";
import { requestNotificationPermission } from "@/lib/notifications";
import { checkAndResetTasks } from "@/lib/task-reset";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();

        // Check and reset tasks if needed
        await checkAndResetTasks();

        // Request notification permission on first load
        if ("Notification" in window && Notification.permission === "default") {
          await requestNotificationPermission();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsInitialized(true); // Still show the app even if initialization fails
      }
    };

    init();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-wellness flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">MindSpace</h1>
            <p className="text-muted-foreground">
              Setting up your wellness companion...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Navigation>
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
        <div className="w-full md:max-w-4xl mx-auto">
          <Outlet />
          <TanStackRouterDevtools />
          <Toaster />
        </div>
      </main>
    </Navigation>
  );
}
