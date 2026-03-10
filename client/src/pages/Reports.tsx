import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-bold">Reports & Analytics</h2>
            <p className="text-muted-foreground mt-1 text-lg">Generate comprehensive ASO performance reports.</p>
          </div>
          <Button disabled className="rounded-xl">
            <Download className="w-5 h-5 mr-2" /> Export PDF
          </Button>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center h-[50vh] bg-gradient-to-b from-card to-background border border-border/40 rounded-3xl shadow-sm text-center p-8 relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
          
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-inner shadow-primary/20">
            <BarChart3 className="w-10 h-10" />
          </div>
          
          <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            Advanced Reporting <Sparkles className="w-5 h-5 text-amber-400" />
          </h3>
          <p className="text-muted-foreground max-w-md mt-4 text-lg">
            We are building a powerful new reporting engine that will allow you to cross-reference organic growth with competitor movements.
          </p>
          
          <div className="mt-8 px-6 py-3 bg-muted/40 rounded-full border border-border/50 text-sm font-medium text-foreground">
            Coming in Q3 Release
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
