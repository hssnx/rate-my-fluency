import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import Rating from "./pages/Rating";

export function AppRoutes() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Switch>
        <Route path="/">
          {!session ? <Landing /> : <Redirect to="/app" />}
        </Route>
        <Route path="/app">
          {session ? (
            <Home>
              {profile?.is_admin ? <Dashboard /> : <Rating />}
            </Home>
          ) : (
            <Redirect to="/" />
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
} 