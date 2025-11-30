'use client';

import { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ApprovalStatusToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  showConfirmation?: boolean;
  confirmationMessage?: string;
  onAuditLog?: (action: string, previousValue: boolean, newValue: boolean) => void;
}

export function ApprovalStatusToggle({
  value,
  onChange,
  disabled = false,
  showConfirmation = false,
  confirmationMessage = "Are you sure you want to change the approval status?",
  onAuditLog
}: ApprovalStatusToggleProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  const handleToggle = (newValue: boolean) => {
    if (showConfirmation && newValue !== value) {
      setPendingValue(newValue);
      setIsConfirming(true);
    } else {
      executeChange(newValue);
    }
  };

  const executeChange = (newValue: boolean) => {
    const previousValue = value;
    onChange(newValue);
    
    if (onAuditLog) {
      const action = newValue ? 'Approved' : 'Rejected';
      onAuditLog(action, previousValue, newValue);
    }
    
    setIsConfirming(false);
    setPendingValue(null);
  };

  const cancelConfirmation = () => {
    setIsConfirming(false);
    setPendingValue(null);
  };

  const getConfirmationTitle = () => {
    if (pendingValue === null) return "Confirm Action";
    return pendingValue ? "Confirm Approval" : "Confirm Rejection";
  };

  const getConfirmationDescription = () => {
    if (pendingValue === null) return confirmationMessage;
    const action = pendingValue ? "approve" : "reject";
    const currentStatus = value ? "approved" : "rejected";
    return `You are about to ${action} this item. It is currently ${currentStatus}. This action will be logged for audit purposes.`;
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Approved Button */}
        <Button
          type="button"
          variant={value ? "default" : "outline"}
          size="sm"
          onClick={() => handleToggle(true)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 transition-all duration-200 cursor-pointer",
            value
              ? "bg-green-600 hover:bg-green-700 text-cream border-green-600"
              : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
          )}
          aria-label={value ? "Currently approved" : "Click to approve"}
          aria-pressed={value}
        >
          <Check className="h-4 w-4" />
          <span>Approved</span>
        </Button>

        {/* Rejected Button */}
        <Button
          type="button"
          variant={!value ? "default" : "outline"}
          size="sm"
          onClick={() => handleToggle(false)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 transition-all duration-200 cursor-pointer",
            !value
              ? "bg-red-600 hover:bg-red-700 text-cream border-red-600"
              : "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          )}
          aria-label={!value ? "Currently rejected" : "Click to reject"}
          aria-pressed={!value}
        >
          <X className="h-4 w-4" />
          <span>Rejected</span>
        </Button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              value ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className="text-gray-600 dark:text-gray-400">
            {value ? "Approved" : "Rejected"}
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {getConfirmationTitle()}
            </DialogTitle>
            <DialogDescription className="text-left">
              {getConfirmationDescription()}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={cancelConfirmation}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => executeChange(pendingValue!)}
              className={cn(
                "cursor-pointer",
                pendingValue
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              )}
            >
              {pendingValue ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}