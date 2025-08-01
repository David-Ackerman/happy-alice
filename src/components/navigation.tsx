import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { CheckSquare, Heart, BarChart3, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation({ children }: { children: React.ReactNode }) {
  const navItems = [
    { id: "", label: "Tarefas", icon: CheckSquare },
    { id: "mood", label: "Humor", icon: Heart },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    { id: "settings", label: "Configurações", icon: Settings },
  ] as const;

  const NavButton = ({ item }: { item: (typeof navItems)[number] }) => {
    const isActive = useLocation().pathname === `/${item.id}`;
    const Icon = item.icon;

    return (
      <Button asChild variant={isActive ? "wellness" : "ghost"}>
        <Link
          className="w-full justify-start gap-3 [&.active]:shadow-wellness hover:bg-accent"
          to={`/${item.id}`}
        >
          <Icon className="h-5 w-5" />
          {item.label}
        </Link>
      </Button>
    );
  };

  return (
    <div className="h-dvh max-h-dvh bg-background flex ">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col space-y-2 w-64 p-4 bg-card border-r border-border">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-wellness flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Happy Alice
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Companheiro de bem-estar diário.
          </p>
        </div>

        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </nav>
      <div className="hidden md:flex flex-1">{children}</div>
      {/* Mobile Navigation */}
      <div className="flex flex-col md:hidden w-full max-w-dvw">
        {/* Mobile Header */}
        <header className="w-full flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-wellness flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Happy Alice</h1>
          </div>

          {/* <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Navigation
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your wellness journey
                  </p>
                </div>

                {navItems.map((item) => (
                  <NavButton key={item.id} item={item} />
                ))}
              </div>
            </SheetContent>
          </Sheet> */}
        </header>
        {children}
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={`/${item.id}`}
                key={item.id}
                className="flex flex-col items-center gap-1 h-auto py-2 [&.active]:text-primary text-muted-foreground"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
