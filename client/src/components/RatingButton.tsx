import { Button } from "@/components/ui/button";

interface RatingButtonProps {
  value: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function RatingButton({ value, isSelected, onClick }: RatingButtonProps) {
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={`w-8 h-8 p-0 text-xs font-medium rounded-full transition-colors ${
        isSelected 
          ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
          : "bg-gray-200 hover:bg-primary/10 text-gray-700"
      }`}
      onClick={onClick}
    >
      {value}
    </Button>
  );
}
