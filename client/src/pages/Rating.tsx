import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RatingButton from "@/components/RatingButton";
import { supabase } from "@/lib/supabaseClient";

// A component to display past ratings
function RatingsList() {
  const { user } = useAuth();
  const { data: ratings, isLoading } = useQuery({
    queryKey: ["ratings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) return <p>Loading ratings...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Past Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        {ratings && ratings.length > 0 ? (
          <ul className="space-y-4">
            {ratings.map((rating) => (
              <li key={rating.id} className="p-4 border rounded-md">
                <p>Naturalness: {rating.naturalness}/10</p>
                <p>Confidence: {rating.confidence}/10</p>
                <p>Eye Contact: {rating.eye_contact}/10</p>
                {rating.comment && <p>Comment: {rating.comment}</p>}
                <p className="text-sm text-gray-500">
                  {new Date(rating.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't submitted any ratings yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Rating() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [naturalness, setNaturalness] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [eyeContact, setEyeContact] = useState<number>(0);
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
        title: "Success",
        description: "Rating submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["ratings", user?.id] });
      // Reset form
      setNaturalness(0);
      setConfidence(0);
      setEyeContact(0);
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

    if (naturalness === 0 || confidence === 0 || eyeContact === 0) {
      toast({
        title: "Validation Error",
        description: "Please rate all three dimensions (1-10)",
        variant: "destructive",
      });
      return;
    }

    createRatingMutation.mutate({
      naturalness,
      confidence,
      eye_contact: eyeContact,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit a New Fluency Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating inputs */}
            <div>
              <Label>Naturalness</Label>
              <div className="flex space-x-1">
                {[...Array(10)].map((_, i) => (
                  <RatingButton
                    key={i + 1}
                    value={i + 1}
                    isSelected={naturalness === i + 1}
                    onClick={() => setNaturalness(i + 1)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Confidence</Label>
              <div className="flex space-x-1">
                {[...Array(10)].map((_, i) => (
                  <RatingButton
                    key={i + 1}
                    value={i + 1}
                    isSelected={confidence === i + 1}
                    onClick={() => setConfidence(i + 1)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Eye Contact</Label>
              <div className="flex space-x-1">
                {[...Array(10)].map((_, i) => (
                  <RatingButton
                    key={i + 1}
                    value={i + 1}
                    isSelected={eyeContact === i + 1}
                    onClick={() => setEyeContact(i + 1)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={createRatingMutation.isPending}
            >
              {createRatingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <RatingsList />
    </div>
  );
}
