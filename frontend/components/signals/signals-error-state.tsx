import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignalsErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function SignalsErrorState({ message, onRetry }: SignalsErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-1">Failed to load signals</h3>
        <p className="text-sm text-muted-foreground mb-4">{message || "An error occurred"}</p>
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
