import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useKeywords, useCreateKeyword, useDeleteKeyword } from "@/hooks/use-keywords";
import { useApps } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Minus, Search, KeyRound, Loader2 } from "lucide-react";

export default function KeywordTracking() {
  const { data: keywords = [], isLoading } = useKeywords();
  const { data: apps = [] } = useApps();
  const createKeyword = useCreateKeyword();
  const deleteKeyword = useDeleteKeyword();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKeywords = keywords.filter(kw => 
    kw.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createKeyword.mutateAsync({
        appId: parseInt(formData.get("appId") as string),
        term: formData.get("term") as string,
        currentRank: parseInt(formData.get("currentRank") as string) || null,
        previousRank: parseInt(formData.get("previousRank") as string) || null,
        searchVolume: parseInt(formData.get("searchVolume") as string) || null,
        country: formData.get("country") as string,
      });
      setIsOpen(false);
      toast({ title: "Success", description: "Keyword tracking added." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const renderRankChange = (current?: number | null, prev?: number | null) => {
    if (!current || !prev) return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-4 h-4"/> N/A</span>;
    const diff = prev - current; // Lower is better
    if (diff > 0) return <span className="text-emerald-500 font-medium flex items-center gap-1"><ArrowUpRight className="w-4 h-4"/> +{diff}</span>;
    if (diff < 0) return <span className="text-red-500 font-medium flex items-center gap-1"><ArrowDownRight className="w-4 h-4"/> {diff}</span>;
    return <span className="text-muted-foreground font-medium flex items-center gap-1"><Minus className="w-4 h-4"/> 0</span>;
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-bold">Keyword Tracking</h2>
            <p className="text-muted-foreground mt-1 text-lg">Monitor visibility across app stores.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" /> Add Keyword
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Add Keyword</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="term">Keyword Term</Label>
                  <Input id="term" name="term" required className="rounded-xl bg-muted/30" placeholder="e.g. meditation app" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appId">Target App</Label>
                  <Select name="appId" required>
                    <SelectTrigger className="rounded-xl bg-muted/30">
                      <SelectValue placeholder="Select app to track" />
                    </SelectTrigger>
                    <SelectContent>
                      {apps.map(app => (
                        <SelectItem key={app.id} value={app.id.toString()}>{app.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRank">Current Rank</Label>
                    <Input id="currentRank" name="currentRank" type="number" className="rounded-xl bg-muted/30" placeholder="e.g. 5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousRank">Prev. Rank</Label>
                    <Input id="previousRank" name="previousRank" type="number" className="rounded-xl bg-muted/30" placeholder="e.g. 8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="searchVolume">Volume</Label>
                    <Input id="searchVolume" name="searchVolume" type="number" className="rounded-xl bg-muted/30" placeholder="e.g. 4500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country Code</Label>
                  <Input id="country" name="country" defaultValue="us" className="rounded-xl bg-muted/30 uppercase" maxLength={2} />
                </div>

                <Button type="submit" disabled={createKeyword.isPending} className="w-full rounded-xl h-12 text-base">
                  {createKeyword.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track Keyword"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center gap-4 bg-muted/10">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter keywords..." 
                className="pl-9 bg-background border-border/50 rounded-xl"
              />
            </div>
          </div>

          {isLoading ? (
             <div className="flex h-40 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredKeywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <KeyRound className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground">No keywords found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="font-display font-semibold text-foreground">Keyword</TableHead>
                    <TableHead className="font-display font-semibold text-foreground">App</TableHead>
                    <TableHead className="font-display font-semibold text-foreground text-right">Volume</TableHead>
                    <TableHead className="font-display font-semibold text-foreground text-right">Prev Rank</TableHead>
                    <TableHead className="font-display font-semibold text-foreground text-right">Current Rank</TableHead>
                    <TableHead className="font-display font-semibold text-foreground text-right">Change</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map(kw => {
                    const app = apps.find(a => a.id === kw.appId);
                    return (
                      <TableRow key={kw.id} className="table-row-hover border-border/30">
                        <TableCell className="font-medium">{kw.term}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {app?.iconUrl && <img src={app.iconUrl} className="w-6 h-6 rounded-md object-cover" alt="" />}
                            <span className="text-muted-foreground">{app?.name || 'Unknown App'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono">{kw.searchVolume?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono">{kw.previousRank || '-'}</TableCell>
                        <TableCell className="text-right font-semibold font-mono">{kw.currentRank || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            {renderRankChange(kw.currentRank, kw.previousRank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => {
                              if(confirm("Stop tracking this keyword?")) deleteKeyword.mutate(kw.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
