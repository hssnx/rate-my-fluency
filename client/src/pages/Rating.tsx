import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { Play, Volume2, Eye, Star, Clock, TrendingUp } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Custom colored slider component
const ColoredSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    value: number[];
  }
>(({ className, value, ...props }, ref) => {
  const score = value[0];
  const getSliderColorClasses = (score: number) => {
    if (score >= 8) return {
      range: "bg-green-600",
      thumb: "border-green-600",
      track: "bg-green-100"
    };
    if (score >= 6) return {
      range: "bg-blue-600", 
      thumb: "border-blue-600",
      track: "bg-blue-100"
    };
    if (score >= 3) return {
      range: "bg-gray-500",
      thumb: "border-gray-500",
      track: "bg-gray-100"
    };
    return {
      range: "bg-red-500",
      thumb: "border-red-500", 
      track: "bg-red-100"
    };
  };

  const colors = getSliderColorClasses(score);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track className={`relative h-2 w-full grow overflow-hidden rounded-full ${colors.track}`}>
        <SliderPrimitive.Range className={`absolute h-full ${colors.range}`} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={`block h-5 w-5 rounded-full border-2 ${colors.thumb} bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`} />
    </SliderPrimitive.Root>
  );
});
ColoredSlider.displayName = "ColoredSlider";

// Chart configuration for ShadCN
const chartConfig = {
  naturalness: {
    label: "Naturalness",
    color: "#2563eb", // blue-600
  },
  confidence: {
    label: "Confidence", 
    color: "#dc2626", // red-600
  },
  eye_contact: {
    label: "Eye Contact",
    color: "#16a34a", // green-600
  },
};

// Interactive fluency chart component
function FluencyChart() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'1M' | '6M' | '1Y' | 'ALL'>('ALL');
  const [selectedRating, setSelectedRating] = useState<any>(null);

  const { data: ratings, isLoading } = useQuery({
    queryKey: ["ratings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  // Filter data based on time range
  const getFilteredData = () => {
    if (!ratings) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFilter) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return ratings
      .filter(rating => new Date(rating.created_at) >= startDate)
      .map(rating => ({
        ...rating,
        date: new Date(rating.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        shortDate: new Date(rating.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));
  };

  const filteredData = getFilteredData();

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const rating = data.activePayload[0].payload;
      setSelectedRating(rating);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 3) return "text-gray-600";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Your rating history
            </CardTitle>
            <div className="flex gap-2">
              {(['1M', '6M', '1Y', 'ALL'] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeFilter === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter(period)}
                  className={timeFilter === period ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">Loading your progress...</p>
            </div>
          ) : !filteredData || filteredData.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No data for this time period</p>
              <p className="text-sm text-gray-400">
                {timeFilter !== 'ALL' ? 'Try selecting a longer time range' : 'Start collecting ratings to see your progress'}
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <LineChart
                data={filteredData}
                onClick={handlePointClick}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="shortDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 10]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                          <p className="font-medium mb-2">{data.date}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-3 w-3 text-blue-600" />
                              <span className="text-sm">Naturalness: {data.naturalness}/10</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 text-red-600" />
                              <span className="text-sm">Confidence: {data.confidence}/10</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-3 w-3 text-green-600" />
                              <span className="text-sm">Eye Contact: {data.eye_contact}/10</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="naturalness"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="eye_contact"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#16a34a", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Selected Rating Details */}
      {selectedRating && (
        <Card className="shadow-sm border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Rating from {selectedRating.date}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRating(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Naturalness</span>
                </div>
                <span className={`text-2xl font-semibold ${getScoreColor(selectedRating.naturalness)}`}>
                  {selectedRating.naturalness}/10
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Confidence</span>
                </div>
                <span className={`text-2xl font-semibold ${getScoreColor(selectedRating.confidence)}`}>
                  {selectedRating.confidence}/10
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Eye Contact</span>
                </div>
                <span className={`text-2xl font-semibold ${getScoreColor(selectedRating.eye_contact)}`}>
                  {selectedRating.eye_contact}/10
                </span>
              </div>
            </div>
            {selectedRating.comment && (
              <div className="mt-4 p-4 bg-blue-100 rounded-lg border-l-4 border-blue-600">
                <p className="text-sm text-gray-700">"{selectedRating.comment}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// YouTube video player component
function YouTubeVideoPlayer() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch video URL from config
  const { data: config, error } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config")
        .select("playlist_url") // Still using 'playlist_url' field for simplicity
        .eq("id", "singleton")
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    },
  });

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      return null;
    } catch {
      return null;
    }
  };

  // Set video ID when config data changes
  React.useEffect(() => {
    if (config) {
      const extractedId = config.playlist_url ? extractVideoId(config.playlist_url) : null;
      setVideoId(extractedId);
    }
    if (config !== undefined || error) {
      setIsLoading(false);
    }
  }, [config, error]);

  if (isLoading) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no video ID, render nothing
  if (!videoId) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title="Fluency practice video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rating() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [naturalness, setNaturalness] = useState<number[]>([5]);
  const [confidence, setConfidence] = useState<number[]>([5]);
  const [eyeContact, setEyeContact] = useState<number[]>([5]);
  const [comment, setComment] = useState("");

  const createRatingMutation = useMutation({
    mutationFn: async (ratingData: {
      naturalness: number;
      confidence: number;
      eye_contact: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("ratings")
        .insert([{ ...ratingData, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback",
      });
      queryClient.invalidateQueries({ queryKey: ["ratings", user?.id] });
      // Reset form
      setNaturalness([5]);
      setConfidence([5]);
      setEyeContact([5]);
      setComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createRatingMutation.mutate({
      naturalness: naturalness[0],
      confidence: confidence[0],
      eye_contact: eyeContact[0],
      comment: comment.trim() || undefined,
    });
  };

  const getSliderColor = (value: number) => {
    if (value >= 8) return "text-green-600";
    if (value >= 6) return "text-blue-600";
    if (value >= 3) return "text-gray-600";
    return "text-red-500";
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Rate my fluency</h1>
          <p className="text-gray-600">Help me improve by providing honest feedback after watching my latest video clip or by speaking directly to me</p>
        </div>

        {/* Video Player (will render nothing if no video is configured) */}
        <YouTubeVideoPlayer />

        {/* Rating Form */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Rating Sliders */}
              <div className="space-y-6">
                {/* Naturalness */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium">Naturalness</Label>
                    </div>
                    <span className={`text-sm font-medium ${getSliderColor(naturalness[0])}`}>
                      {naturalness[0]}/10
                    </span>
                  </div>
                  <ColoredSlider
                    value={naturalness}
                    onValueChange={setNaturalness}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Robotic</span>
                    <span>Very natural</span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium">Confidence</Label>
                    </div>
                    <span className={`text-sm font-medium ${getSliderColor(confidence[0])}`}>
                      {confidence[0]}/10
                    </span>
                  </div>
                  <ColoredSlider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Hesitant</span>
                    <span>Very confident</span>
                  </div>
                </div>

                {/* Eye Contact */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <Label className="text-sm font-medium">Eye contact</Label>
                    </div>
                    <span className={`text-sm font-medium ${getSliderColor(eyeContact[0])}`}>
                      {eyeContact[0]}/10
                    </span>
                  </div>
                  <ColoredSlider
                    value={eyeContact}
                    onValueChange={setEyeContact}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Avoided</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium">Additional feedback (optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any specific observations or encouragement..."
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={createRatingMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createRatingMutation.isPending ? "Submitting..." : "Submit rating"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Interactive Fluency Chart */}
        <FluencyChart />
      </div>
    </div>
  );
}
