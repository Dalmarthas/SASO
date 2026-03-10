import { Link, useLocation } from "wouter";
import { LayoutDashboard, Smartphone, KeyRound, BarChart3, Settings, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "App Catalog", icon: Smartphone },
  { href: "/keywords", label: "Keyword Tracking", icon: KeyRound },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
          <Orbit className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight text-foreground">Aura ASO</h1>
          <p className="text-xs text-muted-foreground font-medium">Intelligence Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200", 
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}
