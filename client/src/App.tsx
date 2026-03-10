import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "./pages/Dashboard";
import AppCatalog from "./pages/AppCatalog";
import KeywordTracking from "./pages/KeywordTracking";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/catalog" component={AppCatalog} />
      <Route path="/keywords" component={KeywordTracking} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
