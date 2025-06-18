import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { 
  BarChart3, Users, Star, MessageSquare, TrendingUp, Youtube, Settings,
  Calendar, Clock, Award, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { format, subDays, startOfDay, endOfDay, getDay, getHours, startOfMonth, endOfMonth, getDaysInMonth, addMonths, subMonths, getDate } from "date-fns";

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch all ratings data for comprehensive analytics
  const { data: allRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["all-ratings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  // Fetch current playlist URL
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config")
        .select("playlist_url")
        .eq("id", "singleton")
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    },
  });



  // Update playlist URL when config data changes
  useEffect(() => {
    if (config?.playlist_url) {
      setPlaylistUrl(config.playlist_url);
    }
  }, [config]);

  // Update playlist URL mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async (newUrl: string) => {
      const { error } = await supabase
        .from("config")
        .upsert({ id: "singleton", playlist_url: newUrl });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Playlist updated",
        description: "YouTube playlist URL has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update playlist URL",
        variant: "destructive",
      });
    },
  });

  // Data processing functions
  const processedData = useMemo(() => {
    if (!allRatings) return null;

    const now = new Date();
    const getFilteredRatings = () => {
      if (timeRange === 'all') return allRatings;
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = subDays(now, daysBack);
      return allRatings.filter(rating => new Date(rating.created_at) >= cutoff);
    };

    const filteredRatings = getFilteredRatings();

    // Trend data - daily averages
    const trendData = filteredRatings.reduce((acc, rating) => {
      const date = format(new Date(rating.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, naturalness: [], confidence: [], eye_contact: [] };
      }
      acc[date].naturalness.push(rating.naturalness);
      acc[date].confidence.push(rating.confidence);
      acc[date].eye_contact.push(rating.eye_contact);
      return acc;
    }, {} as Record<string, any>);

    const trendChartData = Object.values(trendData).map((day: any) => ({
      date: day.date,
      naturalness: Math.round((day.naturalness.reduce((a: number, b: number) => a + b, 0) / day.naturalness.length) * 10) / 10,
      confidence: Math.round((day.confidence.reduce((a: number, b: number) => a + b, 0) / day.confidence.length) * 10) / 10,
      eye_contact: Math.round((day.eye_contact.reduce((a: number, b: number) => a + b, 0) / day.eye_contact.length) * 10) / 10,
    }));

    // Distribution data - histograms
    const createDistribution = (values: number[], metric: string) => {
      const bins = [0, 2, 4, 6, 8, 10].map((start, i, arr) => ({
        range: i === arr.length - 1 ? `${start}+` : `${start}-${arr[i + 1] - 1}`,
        count: values.filter(v => i === arr.length - 1 ? v >= start : v >= start && v < arr[i + 1]).length,
        metric
      }));
      return bins.filter(bin => bin.count > 0);
    };

    const distributions = {
      naturalness: createDistribution(filteredRatings.map(r => r.naturalness), 'naturalness'),
      confidence: createDistribution(filteredRatings.map(r => r.confidence), 'confidence'),
      eye_contact: createDistribution(filteredRatings.map(r => r.eye_contact), 'eye_contact'),
    };

    // Rolling averages (7-day)
    const rollingAverages = trendChartData.slice(-7).reduce((acc, day) => {
      acc.naturalness = (acc.naturalness + day.naturalness) / (acc.count + 1);
      acc.confidence = (acc.confidence + day.confidence) / (acc.count + 1);
      acc.eye_contact = (acc.eye_contact + day.eye_contact) / (acc.count + 1);
      acc.count = acc.count + 1;
      return acc;
    }, { naturalness: 0, confidence: 0, eye_contact: 0, count: 0 });

    // Full year activity heatmap data
    const endDate = endOfMonth(selectedMonth);
    const startDate = startOfMonth(subMonths(selectedMonth, 11)); // 12 months back
    
    const yearRatings = allRatings?.filter(rating => {
      const ratingDate = new Date(rating.created_at);
      return ratingDate >= startDate && ratingDate <= endDate;
    }) || [];

    const dailyActivity = yearRatings.reduce((acc, rating) => {
      const date = new Date(rating.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create full year activity grid
    const activityData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const dayOfMonth = getDate(currentDate);
      const monthYear = format(currentDate, 'MMM');
      
      activityData.push({
        date: dateKey,
        day: dayOfMonth,
        month: monthYear,
        count: dailyActivity[dateKey] || 0,
        isCurrentMonth: format(currentDate, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM')
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const heatmapData = activityData;

    // Best and worst ratings
    const ratingsWithAvg = filteredRatings.map(rating => ({
      ...rating,
      average: Math.round(((rating.naturalness + rating.confidence + rating.eye_contact) / 3) * 10) / 10
    }));

    const bestRatings = ratingsWithAvg
      .sort((a, b) => b.average - a.average)
      .slice(0, 7);

    const worstRatings = ratingsWithAvg
      .sort((a, b) => a.average - b.average)
      .slice(0, 7);

    // Stats
    const stats = {
      totalRatings: filteredRatings.length,
      uniqueRaters: new Set(filteredRatings.map(r => r.id)).size,
      avgNaturalness: Math.round((filteredRatings.reduce((acc, r) => acc + r.naturalness, 0) / filteredRatings.length) * 10) / 10,
      avgConfidence: Math.round((filteredRatings.reduce((acc, r) => acc + r.confidence, 0) / filteredRatings.length) * 10) / 10,
      avgEyeContact: Math.round((filteredRatings.reduce((acc, r) => acc + r.eye_contact, 0) / filteredRatings.length) * 10) / 10,
    };

    return {
      trendChartData,
      distributions,
      rollingAverages,
      heatmapData,
      bestRatings,
      worstRatings,
      stats
    };
  }, [allRatings, timeRange, selectedMonth]);

  const getScoreBadge = (score: number) => {
    if (score >= 8) return { color: "bg-green-100 text-green-800 border-green-200", label: "excellent" };
    if (score >= 6) return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "good" };
    return { color: "bg-red-100 text-red-800 border-red-200", label: "needs work" };
  };

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlaylistMutation.mutate(playlistUrl.trim());
  };

  if (ratingsLoading || !processedData) {
    return (
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your fluency progress</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-xs"
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Ratings</p>
                <p className="text-xl font-semibold text-gray-900">{processedData.stats.totalRatings}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">People Helping</p>
                <p className="text-xl font-semibold text-gray-900">{processedData.stats.uniqueRaters}</p>
              </div>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Naturalness</p>
                <p className="text-xl font-semibold text-gray-900">{processedData.stats.avgNaturalness}</p>
                <div className="text-xs text-green-600 mt-1">
                  7d avg: {processedData.rollingAverages.naturalness.toFixed(1)}
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Confidence</p>
                <p className="text-xl font-semibold text-gray-900">{processedData.stats.avgConfidence}</p>
                <div className="text-xs text-blue-600 mt-1">
                  7d avg: {processedData.rollingAverages.confidence.toFixed(1)}
                </div>
              </div>
              <Star className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Eye Contact</p>
                <p className="text-xl font-semibold text-gray-900">{processedData.stats.avgEyeContact}</p>
                <div className="text-xs text-purple-600 mt-1">
                  7d avg: {processedData.rollingAverages.eye_contact.toFixed(1)}
                </div>
              </div>
              <AlertCircle className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="space-y-6">
        {/* Full Width Trend Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Progress Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedData.trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="naturalness" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                  name="Naturalness"
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Confidence"
                />
                <Area 
                  type="monotone" 
                  dataKey="eye_contact" 
                  stackId="3"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                  name="Eye Contact"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distributions Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Naturalness Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={processedData.distributions.naturalness}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Confidence Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={processedData.distributions.confidence}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Eye Contact Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={processedData.distributions.eye_contact}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Highlights and Activity Pattern */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Performance Highlights - spans 2 columns */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Performance Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-3">🏆 Best Sessions</h4>
                  <div className="space-y-2">
                    {processedData.bestRatings.map((rating, index) => (
                      <div key={rating.id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {format(new Date(rating.created_at), 'MMM dd')}
                        </span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {rating.average}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-700 mb-3">📈 Growth Opportunities</h4>
                  <div className="space-y-2">
                    {processedData.worstRatings.map((rating, index) => (
                      <div key={rating.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {format(new Date(rating.created_at), 'MMM dd')}
                        </span>
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          {rating.average}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Heatmap - spans 1 column */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Activity Pattern
              </CardTitle>
              <div className="text-sm text-gray-600">
                {format(subMonths(selectedMonth, 11), 'MMM yyyy')} - {format(selectedMonth, 'MMM yyyy')}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity Board Grid - GitHub style */}
              <div className="flex flex-wrap gap-1">
                {processedData.heatmapData.map((cell, index) => {
                  const maxCount = Math.max(...processedData.heatmapData.map(c => c.count));
                  const intensity = maxCount > 0 ? cell.count / maxCount : 0;
                  
                  return (
                    <div
                      key={index}
                      className="h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor: intensity > 0
                          ? `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`
                          : '#f1f5f9'
                      }}
                      title={`${cell.date} - ${cell.count} rating${cell.count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(subMonths(selectedMonth, 12))}
                  className="w-8 h-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth(addMonths(selectedMonth, 12))}
                  className="w-8 h-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

             {/* YouTube Video Configuration */}
       <Card className="shadow-sm">
         <CardHeader>
           <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
             <Settings className="h-4 w-4 text-blue-600" />
             Submit a video for rating
           </CardTitle>
         </CardHeader>
         <CardContent className="p-6">
           <form onSubmit={handlePlaylistSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="playlist-url" className="text-sm font-medium">
                 YouTube Video URL
               </Label>
               <div className="flex items-center space-x-2">
                 <Youtube className="h-4 w-4 text-red-600 flex-shrink-0" />
                 <Input
                   id="playlist-url"
                   type="url"
                   value={playlistUrl}
                   onChange={(e) => setPlaylistUrl(e.target.value)}
                   placeholder="https://www.youtube.com/watch?v=..."
                   className="flex-1"
                   disabled={configLoading || updatePlaylistMutation.isPending}
                 />
               </div>
               <p className="text-xs text-gray-500">
                 Enter a YouTube video URL. This video will be shown on the rating page. Leave empty to hide the video player.
               </p>
             </div>
             <div className="flex items-center space-x-3">
               <Button
                 type="submit"
                 disabled={updatePlaylistMutation.isPending}
                 className="bg-blue-600 hover:bg-blue-700"
               >
                 {updatePlaylistMutation.isPending ? "Saving..." : "Save Video URL"}
               </Button>
               {config?.playlist_url && (
                 <p className="text-xs text-green-600">
                   ✓ Current video configured
                 </p>
               )}
             </div>
           </form>
         </CardContent>
       </Card>

            </div>
   );
 }
