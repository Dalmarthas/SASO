import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApps, useDeleteApp, useImportApp } from "@/hooks/use-apps";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, Plus, Smartphone, Trash2 } from "lucide-react";

export default function AppCatalog() {
  const { data: apps = [], isLoading } = useApps();
  const { data: workspaces = [] } = useWorkspaces();
  const importApp = useImportApp();
  const deleteApp = useDeleteApp();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const workspaceId = formData.get("workspaceId")
      ? Number.parseInt(formData.get("workspaceId") as string, 10)
      : workspaces[0]?.id || 1;

    try {
      const app = await importApp.mutateAsync({
        workspaceId,
        type: formData.get("type") as "owned" | "competitor",
        url: formData.get("url") as string,
      });

      form.reset();
      setIsOpen(false);
      toast({
        title: "App imported",
        description: `${app.name} was added to your catalog.`,
      });
      navigate(`/catalog/${app.id}`);
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive",
      });
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
            <DialogContent className="sm:max-w-[520px] rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Import App From Store URL</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Store URL</Label>
                  <Input
                    id="url"
                    name="url"
                    required
                    className="rounded-xl bg-muted/30"
                    placeholder="https://apps.apple.com/... or https://play.google.com/store/apps/details?id=..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste an App Store or Google Play app URL. The service will detect the store and pull the metadata automatically.
                  </p>
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
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id.toString()}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={importApp.isPending} className="w-full rounded-xl h-12 text-base">
                  {importApp.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Import App"}
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
            <p className="text-muted-foreground mt-2">Paste your first store URL to start tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => (
              <Card
                key={app.id}
                onClick={() => navigate(`/catalog/${app.id}`)}
                className="border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 rounded-2xl group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Badge className={app.type === "owned" ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-accent text-accent-foreground hover:bg-accent"}>
                    {app.type.charAt(0).toUpperCase() + app.type.slice(1)}
                  </Badge>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      if (confirm("Delete this app?")) deleteApp.mutate(app.id);
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

                  {app.primaryCategory && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{app.primaryCategory}</p>
                  )}

                  <div className="mt-5 flex items-center gap-4 text-xs font-medium text-muted-foreground border-t border-border/40 pt-4">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      {app.store === "apple" ? "App Store" : "Google Play"}
                    </span>
                    <span className="text-muted-foreground/50 text-[10px] truncate">ID: {app.storeId}</span>
                  </div>

                  {app.storeUrl && (
                    <a
                      href={app.storeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      View store listing <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
