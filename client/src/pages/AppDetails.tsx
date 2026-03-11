import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApps } from "@/hooks/use-apps";
import { useKeywords } from "@/hooks/use-keywords";
import { ArrowLeft, Calendar, ExternalLink, Globe, Loader2, Search, Smartphone, Star, Type } from "lucide-react";

function formatNumber(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRating(value: number | null) {
  if (value === null) return "-";
  return value.toFixed(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function AppDetails() {
  const [, params] = useRoute("/catalog/:id");
  const [, navigate] = useLocation();
  const { data: apps = [], isLoading: appsLoading } = useApps();
  const { data: keywords = [], isLoading: keywordsLoading } = useKeywords();

  const appId = Number.parseInt(params?.id ?? "", 10);
  const app = useMemo(() => apps.find((entry) => entry.id === appId), [apps, appId]);
  const appKeywords = useMemo(() => keywords.filter((entry) => entry.appId === appId), [keywords, appId]);

  if (appsLoading || keywordsLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!Number.isInteger(appId) || !app) {
    return (
      <AppLayout>
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-border/60 bg-card p-10 shadow-sm">
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/catalog")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
          </Button>
          <div>
            <h2 className="text-3xl font-display font-bold">App not found</h2>
            <p className="mt-2 text-muted-foreground">This app is not in the current local catalog.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/catalog")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-4">
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.name} className="h-20 w-20 rounded-3xl object-cover shadow-md" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-display font-bold">{app.name}</h1>
                  <Badge className={app.type === "owned" ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-accent text-accent-foreground hover:bg-accent"}>
                    {app.type === "owned" ? "Owned" : "Competitor"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {app.store === "apple" ? "App Store" : "Google Play"}
                  </Badge>
                </div>
                <p className="mt-1 text-lg text-muted-foreground">{app.developer || "Unknown Developer"}</p>
                {app.primaryCategory && <p className="mt-1 text-sm text-muted-foreground">{app.primaryCategory}</p>}
              </div>
            </div>
          </div>

          {app.storeUrl && (
            <a href={app.storeUrl} target="_blank" rel="noreferrer">
              <Button className="rounded-xl shadow-lg shadow-primary/20">
                Open Store Listing <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current rating</p>
                <p className="text-2xl font-display font-bold">{formatRating(app.rating)}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(app.ratingCount)} ratings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracked keywords</p>
                <p className="text-2xl font-display font-bold">{appKeywords.length}</p>
                <p className="text-xs text-muted-foreground">Keywords linked to this app</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600">
                <Type className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Summary length</p>
                <p className="text-2xl font-display font-bold">{app.summary?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Characters in short description</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Imported</p>
                <p className="text-2xl font-display font-bold">{formatDate(app.createdAt)}</p>
                <p className="text-xs text-muted-foreground">Local catalog timestamp</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-3xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Store metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Store</p>
                  <p className="mt-2 text-base font-semibold">{app.store === "apple" ? "Apple App Store" : "Google Play Store"}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Store ID</p>
                  <p className="mt-2 break-all text-base font-semibold">{app.storeId}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Developer</p>
                  <p className="mt-2 text-base font-semibold">{app.developer || "-"}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary category</p>
                  <p className="mt-2 text-base font-semibold">{app.primaryCategory || "-"}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-border/50 bg-background p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Type className="h-4 w-4" /> Short description
                </div>
                <p className="text-base leading-7 text-foreground/90">{app.summary || "No short description was available from the store payload."}</p>
              </div>

              <div className="rounded-3xl border border-border/50 bg-background p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Globe className="h-4 w-4" /> Full description
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">
                  {app.description || "No long description was available from the store payload."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Tracked keywords</CardTitle>
              </CardHeader>
              <CardContent>
                {appKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tracked keywords are connected to this app yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appKeywords.map((keyword) => (
                      <div key={keyword.id} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{keyword.term}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {keyword.country} / {keyword.language}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-semibold">#{keyword.currentRank ?? "-"}</p>
                            <p className="text-xs text-muted-foreground">Prev: {keyword.previousRank ?? "-"}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Volume: {formatNumber(keyword.searchVolume)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Screenshots</CardTitle>
              </CardHeader>
              <CardContent>
                {app.screenshots && app.screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {app.screenshots.map((screenshot, index) => (
                      <a key={screenshot} href={screenshot} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
                        <img src={screenshot} alt={`${app.name} screenshot ${index + 1}`} className="aspect-[9/19] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No screenshots were captured from the store listing.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
