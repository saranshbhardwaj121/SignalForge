import { Signal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SignalsEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Signal className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No ticker selected</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
          Enter a ticker symbol above to view buy and sell signals
        </p>
        <p className="text-xs text-muted-foreground">
          Try AAPL, MSFT, GOOGL, or TSLA
        </p>
      </CardContent>
    </Card>
  );
}
