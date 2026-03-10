import { Search, Bell, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex-1 max-w-md relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search apps, keywords, or reports..." 
          className="pl-10 bg-muted/30 border-none focus-visible:ring-primary/20 h-11 rounded-xl"
        />
      </div>

      <div className="flex items-center gap-4 ml-4">
        <Button variant="outline" size="icon" className="rounded-xl border-border/50 hover:bg-muted/50">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Quick Add
        </Button>
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-accent to-muted border border-border/50 flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
