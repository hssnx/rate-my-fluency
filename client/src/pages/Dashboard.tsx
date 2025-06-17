import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { BarChart3, Users, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Profile {
  is_admin: boolean;
  // other profile fields
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setProfile(data);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Ensure you have an RPC function `get_admin_stats` in your Supabase SQL editor
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!profile?.is_admin,
  });

  const { data: recentRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["recent-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("*, profiles!inner(email, first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!profile?.is_admin,
  });

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!profile.is_admin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Ratings"
          value={stats?.total_ratings || 0}
          icon={<BarChart3 />}
          loading={statsLoading}
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users || 0}
          icon={<Users />}
          loading={statsLoading}
        />
        <StatCard
          title="Avg. Naturalness"
          value={stats?.avg_naturalness || 0}
          icon={<Star />}
          loading={statsLoading}
        />
        <StatCard
          title="Avg. Confidence"
          value={stats?.avg_confidence || 0}
          icon={<TrendingUp />}
          loading={statsLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th>User</th>
                  <th>Naturalness</th>
                  <th>Confidence</th>
                  <th>Eye Contact</th>
                  <th>Date</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratingsLoading ? (
                  <tr>
                    <td colSpan={6}>Loading...</td>
                  </tr>
                ) : (
                  recentRatings?.map((rating: any) => (
                    <tr key={rating.id}>
                      <td>{rating.profiles.email}</td>
                      <td>{rating.naturalness}</td>
                      <td>{rating.confidence}</td>
                      <td>{rating.eye_contact}</td>
                      <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                      <td>{rating.comment}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
