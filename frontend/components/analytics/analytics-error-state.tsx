import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsCardErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function AnalyticsCardErrorState({ message, onRetry }: AnalyticsCardErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          {message || "Failed to load indicator"}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
