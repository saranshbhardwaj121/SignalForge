"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addTickerSchema,
  type AddTickerFormData,
} from "@/features/watchlists/schemas";
import { useAddTickerMutation } from "@/features/watchlists/hooks";

interface AddTickerFormProps {
  watchlistId: string;
}

export function AddTickerForm({ watchlistId }: AddTickerFormProps) {
  const addTickerMutation = useAddTickerMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddTickerFormData>({
    resolver: zodResolver(addTickerSchema),
  });

  const onSubmit = async (data: AddTickerFormData) => {
    try {
      await addTickerMutation.mutateAsync({
        watchlistId,
        ticker: data.ticker.toUpperCase(),
      });
      reset();
    } catch {
      // Error toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Input
          placeholder="Add ticker (e.g. AAPL)"
          {...register("ticker")}
          className={errors.ticker ? "border-destructive" : ""}
        />
        {errors.ticker && (
          <p className="text-xs font-medium text-destructive">
            {errors.ticker.message}
          </p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        <span className="ml-1 hidden sm:inline">Add</span>
      </Button>
    </form>
  );
}
