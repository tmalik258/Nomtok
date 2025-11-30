import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: string | number;
  label: string;
  isGradient?: boolean;
  showBadge?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  value,
  label,
  isGradient = false,
  showBadge = false,
}) => {
  return (
    <div
      className={cn(
        "rounded-lg shadow-lg p-6 text-center flex-1 flex flex-col items-center justify-center bg-white",
        isGradient
          ? "bg-gradient-to-br from-orange-400 to-red-500 text-cream relative"
          : "bg-white"
      )}
    >
      {showBadge && (
        <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rotate-12">
          ⭐ TOP
        </Badge>
      )}
      <div
        className={`text-2xl md:text-3xl font-bold ${
          isGradient ? "text-cream" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      <div
        className={`text-sm md:text-base ${
          isGradient ? "text-cream" : "text-gray-600"
        }`}
      >
        {label}
      </div>
    </div>
  );
};
