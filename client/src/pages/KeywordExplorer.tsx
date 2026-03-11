import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { api } from "@shared/routes";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApps, useImportApp } from "@/hooks/use-apps";
import { useExploreKeywords, useKeywords } from "@/hooks/use-keywords";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";

type ExplorerFormState = {
  appId: string;
  seed: string;
  country: string;
  language: string;
  limit: string;
};

type ExplorerApp = z.infer<typeof api.apps.list.responses[200]>[number];
type ExplorerKeyword = z.infer<typeof api.keywords.list.responses[200]>[number];
type ExplorerResult = z.infer<typeof api.keywords.explore.responses[200]>["results"][number];

const DEFAULT_COUNTRY = "us";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_LIMIT = "25";

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getDefaultSeed(app: ExplorerApp | undefined, keywords: ExplorerKeyword[]) {
  if (!app) {
    return "";
  }

  const trackedKeyword = keywords.find((keyword) => keyword.appId === app.id)?.term;
  if (trackedKeyword) {
    return trackedKeyword;
  }

  if (app.primaryCategory) {
    return app.primaryCategory.toLowerCase();
  }

  return app.name.toLowerCase();
}

function formatRating(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

function formatCount(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("en-US").format(value);
}

function resultRowClass(result: ExplorerResult) {
  return result.isSelectedApp ? "bg-primary/5 ring-1 ring-inset ring-primary/25" : "";
}

export default function KeywordExplorer() {
  const [, navigate] = useLocation();
  const { data: apps = [], isLoading: appsLoading } = useApps();
  const importApp = useImportApp();
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords();
  const { toast } = useToast();

  const [form, setForm] = useState<ExplorerFormState>({
    appId: "",
    seed: "",
    country: DEFAULT_COUNTRY,
    language: DEFAULT_LANGUAGE,
    limit: DEFAULT_LIMIT,
  });
  const [request, setRequest] = useState<z.infer<typeof api.keywords.explore.input> | null>(null);
  const [addingStoreId, setAddingStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (apps.length === 0 || form.appId) {
      return;
    }

    const firstApp = apps[0];
    const seed = getDefaultSeed(firstApp, keywords);
    setForm({
      appId: firstApp.id.toString(),
      seed,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
      limit: DEFAULT_LIMIT,
    });
    setRequest({
      appId: firstApp.id,
      seed,
      country: DEFAULT_COUNTRY,
      language: DEFAULT_LANGUAGE,
      limit: Number(DEFAULT_LIMIT),
    });
  }, [apps, form.appId, keywords]);

  const { data, isLoading: isExplorerLoading, isFetching, error } = useExploreKeywords(request);

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === Number.parseInt(form.appId || "0", 10)) ?? null,
    [apps, form.appId],
  );

  const quickSeeds = useMemo(() => {
    if (!selectedApp) {
      return [];
    }

    return dedupe([
      ...keywords.filter((keyword) => keyword.appId === selectedApp.id).map((keyword) => keyword.term),
      selectedApp.primaryCategory?.toLowerCase() ?? "",
      selectedApp.name.toLowerCase(),
    ]).slice(0, 5);
  }, [keywords, selectedApp]);

  const runExplore = (nextForm: ExplorerFormState) => {
    const validated = api.keywords.explore.input.parse({
      appId: Number.parseInt(nextForm.appId, 10),
      seed: nextForm.seed,
      country: nextForm.country,
      language: nextForm.language,
      limit: Number.parseInt(nextForm.limit, 10),
    });
    setRequest(validated);
  };

  const isBootstrapping = appsLoading || keywordsLoading || (!request && apps.length > 0);
  const selectedResult = data?.results.find((result) => result.isSelectedApp) ?? null;

  const handleAddToCatalog = async (result: ExplorerResult) => {
    if (!selectedApp) {
      toast({
        title: "No app selected",
        description: "Choose a catalog app before adding search results.",
        variant: "destructive",
      });
      return;
    }

    if (!result.storeUrl) {
      toast({
        title: "Store URL missing",
        description: "This result does not include a store URL, so it cannot be imported yet.",
        variant: "destructive",
      });
      return;
    }

    setAddingStoreId(result.storeId);

    try {
      const app = await importApp.mutateAsync({
        workspaceId: selectedApp.workspaceId,
        clientId: selectedApp.clientId,
        type: "competitor",
        url: result.storeUrl,
      });

      toast({
        title: "App added",
        description: `${app.name} was added to the catalog.`,
      });
    } catch (error) {
      toast({
        title: "Add failed",
        description: error instanceof Error ? error.message : "Unable to add this app to the catalog.",
        variant: "destructive",
      });
    } finally {
      setAddingStoreId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold">Keyword Explorer</h2>
            <p className="mt-1 text-lg text-muted-foreground">
              Search a live keyword and inspect which apps own the top positions for that market.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/keywords")}>
            View tracked keywords <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Card className="overflow-hidden rounded-[28px] border-border/40 bg-gradient-to-br from-slate-950 via-slate-900 to-primary shadow-xl shadow-primary/10">
          <CardContent className="grid gap-6 px-6 py-7 text-white md:grid-cols-[1.4fr_0.8fr] md:px-8">
            <div className="space-y-4">
              <Badge className="w-fit rounded-full border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/90 hover:bg-white/10">
                Keyword Result Search
              </Badge>
              <div className="space-y-3">
                <h3 className="max-w-2xl text-3xl font-display font-bold leading-tight text-white md:text-4xl">
                  See the ranked apps for a keyword and spot exactly where your app shows up.
                </h3>
                <p className="max-w-2xl text-sm leading-7 text-white/75 md:text-base">
                  The result list comes from live store search results, and your selected app is highlighted if it appears in the top positions.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3 text-white/80">
                  <Compass className="h-5 w-5" />
                  <span className="text-sm font-medium">Selected app</span>
                </div>
                <p className="mt-3 text-xl font-display font-bold text-white">{selectedApp?.name ?? "Choose an app"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3 text-white/80">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-medium">Current position</span>
                </div>
                <p className="mt-3 text-xl font-display font-bold text-white">
                  {selectedResult ? `#${selectedResult.position}` : data ? `Not in ${data.results.length} returned` : "Waiting for search"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <form
              className="grid gap-5 xl:grid-cols-[1.1fr_1.5fr_0.55fr_0.55fr_0.45fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                runExplore(form);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="appId">App</Label>
                <Select value={form.appId} onValueChange={(value) => setForm((current) => ({ ...current, appId: value }))}>
                  <SelectTrigger className="rounded-2xl bg-muted/20">
                    <SelectValue placeholder="Select app" />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seed">Keyword</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="seed"
                    value={form.seed}
                    onChange={(event) => setForm((current) => ({ ...current, seed: event.target.value }))}
                    className="rounded-2xl bg-muted/20 pl-10"
                    placeholder="Search a keyword"
                  />
                </div>
                {quickSeeds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {quickSeeds.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                        onClick={() => {
                          const nextForm = { ...form, seed };
                          setForm(nextForm);
                          runExplore(nextForm);
                        }}
                      >
                        {seed}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(event) => setForm((current) => ({ ...current, country: event.target.value.toLowerCase() }))}
                  maxLength={2}
                  className="rounded-2xl bg-muted/20 uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={form.language}
                  onChange={(event) => setForm((current) => ({ ...current, language: event.target.value.toLowerCase() }))}
                  maxLength={5}
                  className="rounded-2xl bg-muted/20 lowercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Results</Label>
                <Input
                  id="limit"
                  type="number"
                  min={6}
                  max={36}
                  value={form.limit}
                  onChange={(event) => setForm((current) => ({ ...current, limit: event.target.value }))}
                  className="rounded-2xl bg-muted/20"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" className="h-11 w-full rounded-2xl shadow-lg shadow-primary/20 xl:w-auto" disabled={isFetching || isBootstrapping}>
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                  Explore
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isBootstrapping ? (
          <div className="flex h-52 items-center justify-center rounded-3xl border border-border/50 bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="rounded-3xl border-destructive/30 bg-destructive/5 shadow-sm">
            <CardContent className="p-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Unable to load keyword results."}
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {!data.selectedAppFound ? (
              <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5 shadow-sm">
                <CardContent className="flex items-start gap-3 p-5 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">{data.selectedAppName} is not in the {data.results.length} returned results for this keyword.</p>
                    <p className="mt-1">The table still shows the live top-ranking apps for {data.store === "apple" ? "the App Store" : "Google Play"}.</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/10 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Top apps for "{data.seed}"</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.store === "apple" ? "App Store" : "Google Play"} results in {data.country.toUpperCase()} / {data.language} - showing {data.results.length} of requested {data.requestedLimit}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {data.results.length} / {data.requestedLimit} shown
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isExplorerLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : data.results.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    No ranked apps were returned for this search.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="w-20">Rank</TableHead>
                          <TableHead>App</TableHead>
                          <TableHead>Developer</TableHead>
                          <TableHead className="text-right">Rating</TableHead>
                          <TableHead>Catalog</TableHead>
                          <TableHead className="w-[132px] text-right">Store</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.results.map((result) => (
                          <TableRow key={`${result.storeId}-${result.position}`} className={`border-border/30 ${resultRowClass(result)}`}>
                            <TableCell>
                              <div className="flex items-center gap-2 font-display text-lg font-bold">
                                <span>#{result.position}</span>
                                {result.isSelectedApp ? <Trophy className="h-4 w-4 text-primary" /> : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                {result.iconUrl ? (
                                  <img src={result.iconUrl} alt={result.name} className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <Sparkles className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold">{result.name}</p>
                                    {result.isSelectedApp ? (
                                      <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
                                        Your app
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {result.summary ? <p className="max-w-xl text-xs leading-5 text-muted-foreground">{result.summary}</p> : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{result.developer ?? "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{formatRating(result.rating)}</div>
                              {result.ratingCount !== null ? (
                                <div className="text-xs text-muted-foreground">{formatCount(result.ratingCount)} ratings</div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              {result.inCatalogType ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                  Added
                                </Badge>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  disabled={importApp.isPending}
                                  onClick={() => {
                                    void handleAddToCatalog(result);
                                  }}
                                >
                                  {importApp.isPending && addingStoreId === result.storeId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : null}
                                  Add
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {result.storeUrl ? (
                                <a href={result.storeUrl} target="_blank" rel="noreferrer">
                                  <Button variant="outline" className="rounded-xl">
                                    Open <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
