"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const formSchema = z.object({
  ticker: z
    .string()
    .min(1, "Enter a ticker symbol")
    .max(20, "Ticker must be 20 characters or less"),
});

type FormData = z.infer<typeof formSchema>;

interface SignalsSearchFormProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export function SignalsSearchForm({ onSearch, isLoading }: SignalsSearchFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    const ticker = data.ticker.toUpperCase().trim();
    onSearch(ticker);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2 max-w-md">
      <div className="flex-1 space-y-1">
        <Input
          placeholder="Search ticker (e.g. AAPL)"
          {...register("ticker")}
          className={errors.ticker ? "border-destructive" : ""}
        />
        {errors.ticker && (
          <p className="text-xs font-medium text-destructive">{errors.ticker.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="ml-2 hidden sm:inline">Analyze</span>
      </Button>
    </form>
  );
}
