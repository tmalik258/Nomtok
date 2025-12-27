import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Job } from "@/lib/types/api";
import { ReactNode, useMemo } from "react";
import { useDashboardRealtime } from "@/lib/contexts/dashboard-realtime-context";

interface JobDetailsDialogProps {
  selectedJob: Job | null;
  onClose: () => void;
  getStatusBadge: (status: Job["status"]) => ReactNode;
  formatDate: (date?: string) => string;
  formatDuration: (startTime?: string, endTime?: string) => string;
}

// Helper function to format error type into readable text
function formatErrorType(type: string): string {
  const errorTypeMap: Record<string, string> = {
    auth_captcha: "Authentication Captcha Required",
    auth_error: "Authentication Error",
    network_error: "Network Connection Error",
    video_not_found: "Video Not Found",
    rate_limit: "Rate Limit Exceeded",
    invalid_url: "Invalid URL",
    download_error: "Download Error",
    processing_error: "Processing Error",
    unknown: "Unknown Error",
  };
  return errorTypeMap[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper function to format JSON error messages into readable format
function formatErrorMessage(parsedMessage: unknown): ReactNode {
  if (typeof parsedMessage !== 'object' || parsedMessage === null) {
    return <span>{String(parsedMessage)}</span>;
  }

  const obj = parsedMessage as Record<string, unknown>;
  const elements: ReactNode[] = [];

  // Handle summary field
  if (obj.summary && typeof obj.summary === 'object' && obj.summary !== null) {
    const summary = obj.summary as Record<string, unknown>;
    const summaryItems: string[] = [];
    
    Object.entries(summary).forEach(([key, value]) => {
      const count = typeof value === 'number' ? value : 0;
      if (count > 0) {
        const errorType = formatErrorType(key);
        summaryItems.push(`${count} ${errorType}${count > 1 ? 's' : ''}`);
      }
    });

    if (summaryItems.length > 0) {
      elements.push(
        <div key="summary" className="mb-3 pb-3 border-b border-red-200">
          <div className="font-semibold text-red-800 mb-1">Summary:</div>
          <div className="text-red-700">{summaryItems.join(', ')}</div>
        </div>
      );
    }
  }

  // Handle errors array
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    elements.push(
      <div key="errors" className="space-y-2">
        <div className="font-semibold text-red-800 mb-2">Details:</div>
        {obj.errors.map((error: unknown, idx: number) => {
          if (typeof error === 'object' && error !== null) {
            const errorObj = error as Record<string, unknown>;
            const errorType = errorObj.type ? formatErrorType(String(errorObj.type)) : 'Error';
            const errorMessage = errorObj.message ? String(errorObj.message) : 'No additional details available';
            
            // Extract the main error message (remove technical details if possible)
            let readableMessage = errorMessage;
            // Remove common technical prefixes
            readableMessage = readableMessage.replace(/^ERROR:\s*\[youtube\]\s*\w+:\s*/i, '');
            readableMessage = readableMessage.replace(/^ERROR:\s*/i, '');
            
            return (
              <div key={idx} className="bg-red-50 rounded p-2 border border-red-100">
                <div className="font-medium text-red-800 mb-1">{errorType}:</div>
                <div className="text-red-700 text-sm whitespace-pre-wrap break-words">{readableMessage}</div>
              </div>
            );
          }
          return (
            <div key={idx} className="text-red-700 text-sm">{String(error)}</div>
          );
        })}
      </div>
    );
  }

  // If no summary or errors, display all fields
  if (elements.length === 0) {
    return (
      <div className="space-y-2">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-semibold text-red-800 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className="ml-2 text-red-700">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <div className="space-y-2">{elements}</div>;
}

export default function JobDetailsDialog({
  selectedJob,
  onClose,
  getStatusBadge,
  formatDate,
  formatDuration,
}: JobDetailsDialogProps) {
  const { getJob } = useDashboardRealtime();
  
  // Get real-time job state if available
  const currentJob = useMemo(() => {
    if (!selectedJob) return null;
    const realtimeJob = getJob(selectedJob.id);
    return realtimeJob ? { ...selectedJob, ...realtimeJob } : selectedJob;
  }, [selectedJob, getJob]);
  return (
    <Dialog open={!!currentJob} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-effect backdrop-blur-xl bg-cream/95 border border-orange-200/50 shadow-2xl max-w-2xl max-h-[80vh] !flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-900">Job Details</DialogTitle>
          </div>
        </DialogHeader>

        {selectedJob && (
          <div className="space-y-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 pl-0 pr-[10px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Job ID
                </label>
                <p className="font-mono text-sm">{selectedJob.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Type
                </label>
                <p>{selectedJob.job_type.replace("_", " ").toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Progress
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={selectedJob.progress}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm">{selectedJob.progress}%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p>{selectedJob.title}</p>
            </div>

            {selectedJob.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="text-sm text-gray-700">
                  {selectedJob.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Total Items
                </label>
                <p>{selectedJob.total_items || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Processed Items
                </label>
                <p>{selectedJob.processed_items}</p>
              </div>
            </div>

            {Array.isArray(selectedJob?.error_messages) && selectedJob?.error_messages?.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600">
                  Error Messages
                </label>
                <div className="overflow-x-hidden bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                  {selectedJob?.error_messages?.map((msg: string, idx: number) => {
                    // Try to parse as JSON for better formatting
                    let parsedMessage: unknown = null;
                    let isJSON = false;
                    try {
                      parsedMessage = JSON.parse(msg);
                      isJSON = true;
                    } catch {
                      // Not JSON, use as string
                    }

                    return (
                      <div key={idx} className="bg-white rounded-md p-3 border border-red-100 shadow-sm">
                        {isJSON && typeof parsedMessage === 'object' && parsedMessage !== null ? (
                          formatErrorMessage(parsedMessage)
                        ) : (
                          <div className="text-sm text-red-700 whitespace-pre-wrap break-words">
                            {msg}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedJob.started_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Started At
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedJob.started_at)}
                  </p>
                </div>
              )}
              {selectedJob.completed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Completed At
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedJob.completed_at)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Duration
                </label>
                <p className="text-sm">
                  {formatDuration(
                    selectedJob.started_at,
                    selectedJob.completed_at
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
