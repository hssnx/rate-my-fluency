import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";
import Dashboard from "./Dashboard";
import Rating from "./Rating";

export default function Home({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    signOut();
    toast({ title: "Signed out successfully" });
    // The AppRoutes component will handle the redirect.
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Fluency Rater
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {profile?.first_name || user?.email?.split('@')[0] || 'there'}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
