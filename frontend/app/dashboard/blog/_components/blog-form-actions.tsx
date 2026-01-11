"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BlogFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  submitText?: string;
}

export function BlogFormActions({
  isSubmitting,
  onCancel,
  submitText = "Save",
}: BlogFormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-orange-500 hover:bg-orange-600"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submitText === "Create Post" ? "Creating..." : "Updating..."}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
}
