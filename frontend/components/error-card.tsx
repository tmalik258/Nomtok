"use client";

import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title?: string;
  message?: string;
  error?: string;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
}

export default function ErrorCard({
  title = "Something went wrong",
  message = "We're having trouble loading the data. Please try again later.",
  error,
  onRefresh,
  showRefreshButton = true
}: ErrorCardProps) {
  return (
    <div className="text-center py-16">
      <div className="not-dark:bg-cream rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-red-100 dark:border-red-600">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-200 p-3 rounded-lg mb-6">{error}</p>
        )}
        {showRefreshButton && onRefresh && (
          <Button 
            onClick={onRefresh}
            variant="outline"
            className="cursor-pointer dark:hover:text-cream dark:bg-orange-500 dark:hover:bg-orange-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}