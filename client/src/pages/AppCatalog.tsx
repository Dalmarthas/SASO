import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApps, useCreateApp, useDeleteApp } from "@/hooks/use-apps";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Smartphone, Loader2 } from "lucide-react";

export default function AppCatalog() {
  const { data: apps = [], isLoading } = useApps();
  const { data: workspaces = [] } = useWorkspaces();
  const createApp = useCreateApp();
  const deleteApp = useDeleteApp();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Fallback to first workspace if not selected
    const wsId = formData.get("workspaceId") 
      ? parseInt(formData.get("workspaceId") as string) 
      : (workspaces[0]?.id || 1);

    try {
      await createApp.mutateAsync({
        workspaceId: wsId,
        store: formData.get("store") as string,
        storeId: formData.get("storeId") as string,
        name: formData.get("name") as string,
        developer: formData.get("developer") as string,
        type: formData.get("type") as string,
        iconUrl: formData.get("iconUrl") as string || null,
      });
      setIsOpen(false);
      toast({ title: "Success", description: "App added to catalog." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-bold">App Catalog</h2>
            <p className="text-muted-foreground mt-1 text-lg">Manage your owned apps and competitors.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" /> Add App
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Add New App</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">App Name</Label>
                    <Input id="name" name="name" required className="rounded-xl bg-muted/30" placeholder="e.g. Aura Meditate" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developer">Developer</Label>
                    <Input id="developer" name="developer" className="rounded-xl bg-muted/30" placeholder="e.g. Aura Health Inc." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="store">App Store</Label>
                    <Select name="store" required defaultValue="apple">
                      <SelectTrigger className="rounded-xl bg-muted/30">
                        <SelectValue placeholder="Select store" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apple">Apple App Store</SelectItem>
                        <SelectItem value="google">Google Play</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeId">Store ID</Label>
                    <Input id="storeId" name="storeId" required className="rounded-xl bg-muted/30" placeholder="e.g. id123456789" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tracking Type</Label>
                    <Select name="type" required defaultValue="owned">
                      <SelectTrigger className="rounded-xl bg-muted/30">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owned">Owned App</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspaceId">Workspace</Label>
                    <Select name="workspaceId" defaultValue={workspaces[0]?.id.toString()}>
                      <SelectTrigger className="rounded-xl bg-muted/30">
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map(ws => (
                          <SelectItem key={ws.id} value={ws.id.toString()}>{ws.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iconUrl">Icon URL (Optional)</Label>
                  <Input id="iconUrl" name="iconUrl" className="rounded-xl bg-muted/30" placeholder="https://..." />
                </div>

                <Button type="submit" disabled={createApp.isPending} className="w-full rounded-xl h-12 text-base">
                  {createApp.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save App to Catalog"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-3xl bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold">No apps added yet</h3>
            <p className="text-muted-foreground mt-2">Add your first app to start tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map(app => (
              <Card key={app.id} className="border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 rounded-2xl group relative overflow-hidden">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Badge className={app.type === 'owned' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-accent text-accent-foreground hover:bg-accent'}>
                    {app.type.charAt(0).toUpperCase() + app.type.slice(1)}
                  </Badge>
                  <button 
                    onClick={() => {
                      if(confirm("Delete this app?")) deleteApp.mutate(app.id);
                    }}
                    className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-24 bg-gradient-to-br from-muted/50 to-muted/20 w-full" />
                
                <CardContent className="p-6 relative pt-0">
                  <div className="-mt-10 mb-4 inline-block p-1 bg-background rounded-2xl shadow-md">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Smartphone className="w-8 h-8 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-display font-bold line-clamp-1" title={app.name}>{app.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{app.developer || "Unknown Developer"}</p>
                  
                  <div className="mt-5 flex items-center gap-4 text-xs font-medium text-muted-foreground border-t border-border/40 pt-4">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      {app.store === 'apple' ? 'App Store' : 'Google Play'}
                    </span>
                    <span className="text-muted-foreground/50 text-[10px] truncate">ID: {app.storeId}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
