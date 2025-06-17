import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { BarChart3, Users, Star, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (error) throw new Error(error.message);
      return data;
    },
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
  });

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
                    <td colSpan={6} className="text-center p-4">Loading...</td>
                  </tr>
                ) : (
                  recentRatings?.map((rating: any) => (
                    <tr key={rating.id} className="text-center">
                      <td className="p-2">{rating.profiles.email}</td>
                      <td className="p-2">{rating.naturalness}</td>
                      <td className="p-2">{rating.confidence}</td>
                      <td className="p-2">{rating.eye_contact}</td>
                      <td className="p-2">{new Date(rating.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{rating.comment || "-"}</td>
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
