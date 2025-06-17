import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Dashboard from "./Dashboard";
import Rating from "./Rating";

export default function Home({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    signOut();
    toast({ title: "Signed out successfully!" });
    // The AppRoutes component will handle the redirect.
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Fluency Rater
          </h1>
          <div className="flex items-center space-x-4">
            {profile && (
               <Badge variant={profile.is_admin ? "destructive" : "secondary"}>
                {profile.is_admin ? "Admin" : "User"}
              </Badge>
            )}
            <span className="text-sm text-gray-600">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
