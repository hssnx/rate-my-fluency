import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    // Or a spinner/loading component
    return <div>Loading...</div>;
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Switch>
        <Route path="/">
          {session ? <Redirect to="/dashboard" /> : <Landing />}
        </Route>
        <Route path="/dashboard">
          {session ? <Home /> : <Redirect to="/" />}
        </Route>
        {/* Add other routes here */}
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
} 