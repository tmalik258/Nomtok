"use client";

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ApprovalStatus = "approved" | "rejected" | "pending";

interface ApprovalStatusToggleProps {
  value: ApprovalStatus;
  onChange: (status: ApprovalStatus) => void;
  disabled?: boolean;
  showConfirmation?: boolean;
  confirmationMessage?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ApprovalStatusToggle({
  value,
  onChange,
  disabled = false,
  showConfirmation = false,
  confirmationMessage = "Are you sure you want to change the approval status?",
  className,
  size = "md",
}: ApprovalStatusToggleProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ApprovalStatus | null>(null);

  const statusConfig = {
    approved: {
      label: "Approved",
      icon: Check,
      bgColor: "bg-green-500/20 hover:bg-green-500/30",
      textColor: "text-green-700 dark:text-green-400",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-500/30",
      ariaLabel: "Status: Approved",
    },
    rejected: {
      label: "Rejected",
      icon: X,
      bgColor: "bg-red-500/20 hover:bg-red-500/30",
      textColor: "text-red-700 dark:text-red-400",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-500/30",
      ariaLabel: "Status: Rejected",
    },
    pending: {
      label: "Pending",
      icon: AlertTriangle,
      bgColor: "bg-yellow-500/20 hover:bg-yellow-500/30",
      textColor: "text-yellow-700 dark:text-yellow-400",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-500/30",
      ariaLabel: "Status: Pending",
    },
  };

  const sizeConfig = {
    sm: {
      button: "px-3 py-1.5 text-sm",
      icon: "h-3 w-3",
      gap: "gap-1.5",
    },
    md: {
      button: "px-4 py-2 text-sm",
      icon: "h-4 w-4",
      gap: "gap-2",
    },
    lg: {
      button: "px-6 py-3 text-base",
      icon: "h-5 w-5",
      gap: "gap-2.5",
    },
  };

  const currentConfig = statusConfig[value];
  const currentSize = sizeConfig[size];
  const IconComponent = currentConfig.icon;

  const handleStatusChange = (newStatus: ApprovalStatus) => {
    if (disabled || newStatus === value) return;

    if (showConfirmation) {
      setPendingStatus(newStatus);
      setShowDialog(true);
    } else {
      onChange(newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      onChange(pendingStatus);
      setPendingStatus(null);
    }
    setShowDialog(false);
  };

  const cancelStatusChange = () => {
    setPendingStatus(null);
    setShowDialog(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, status: ApprovalStatus) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleStatusChange(status);
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Current Status Display */}
        <div
          className={cn(
            "flex items-center border rounded-lg transition-all duration-200",
            currentConfig.bgColor,
            currentConfig.borderColor,
            currentSize.button,
            currentSize.gap,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={currentConfig.ariaLabel}
          role="status"
        >
          <IconComponent className={cn(currentSize.icon, currentConfig.iconColor)} />
          <span className={cn("font-medium", currentConfig.textColor)}>
            {currentConfig.label}
          </span>
        </div>

        {/* Status Change Buttons */}
        {!disabled && (
          <div className="flex items-center gap-1">
            {(["approved", "rejected", "pending"] as ApprovalStatus[]).map((status) => {
              if (status === value) return null;
              
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              
              return (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  onKeyDown={(e) => handleKeyDown(e, status)}
                  className={cn(
                    "h-8 w-8 p-0 rounded-full transition-all duration-200",
                    config.bgColor,
                    config.borderColor,
                    "hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-orange-500/20"
                  )}
                  aria-label={`Change status to ${config.label}`}
                  title={`Change to ${config.label}`}
                >
                  <StatusIcon className={cn("h-3 w-3", config.iconColor)} />
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-cream/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {confirmationMessage}
            </DialogDescription>
          </DialogHeader>
          
          {pendingStatus && (
            <div className="py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Current: <span className={currentConfig.textColor}>{currentConfig.label}</span>
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  New: <span className={statusConfig[pendingStatus].textColor}>
                    {statusConfig[pendingStatus].label}
                  </span>
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelStatusChange}
              className="bg-cream/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 hover:bg-cream/60 dark:hover:bg-gray-800/60"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-cream shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}