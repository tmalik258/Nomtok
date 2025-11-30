import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { JobCardProps } from "@/lib/types/dashboard";
import { Progress } from "@radix-ui/react-progress";
import { CheckCircle, RefreshCw, AlertCircle, Clock, Activity, TrendingUp, Timer, X, Play } from "lucide-react";
import { useState } from "react";

export function JobCard({ job, onTrigger, cancelJob }: JobCardProps & { cancelJob: (jobId: string, reason?: string) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-orange-100 text-orange-800";
      case "running":
        return "bg-orange-100 text-orange-800";
      case "failed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const progress = job.total_items > 0 ? (job.processed_items / job.total_items) * 100 : 0;

  const handleCancelJob = async () => {
    setCancelling(true);
    try {
      await cancelJob(job.id, 'Cancelled by user from dashboard');
      // Optionally trigger a refetch of jobs to update the UI
    } catch (error) {
      console.error('Failed to cancel job:', error);
    } finally {
      setCancelling(false);
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'Not started';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatEstimatedTime = (estimatedTime?: string) => {
    if (!estimatedTime) return 'Unknown';
    const estimated = new Date(estimatedTime);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((estimated.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return remaining > 0 ? `${minutes}m ${seconds}s remaining` : 'Completing...';
  };

  return (
    <Card className="glass-effect backdrop-blur-xl bg-cream/80 border border-orange-200/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{job.title}</CardTitle>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">{job.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {job.status === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{job.processed_items} / {job.total_items}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Enhanced Job Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {job.started_at ? new Date(job.started_at).toLocaleString() : "Not started"}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDuration(job.started_at, job.completed_at)}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {job.job_type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Advanced Tracking Info for Running Jobs */}
          {job.status === "running" && (
            <div className="space-y-3 p-3 bg-orange-50/50 border border-orange-200/50 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {job.queue_size !== undefined && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">Queue:</span>
                    <span className="font-medium text-gray-900">{job.queue_size}</span>
                  </div>
                )}
                {job.items_in_progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">In Progress:</span>
                    <span className="font-medium text-gray-900">{job.items_in_progress}</span>
                  </div>
                )}
                {job.failed_items !== undefined && job.failed_items > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{job.failed_items}</span>
                  </div>
                )}
                {job.processing_rate !== undefined && job.processing_rate !== null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium text-green-600">{typeof job.processing_rate === 'number' ? job.processing_rate.toFixed(1) : '0.0'}/min</span>
                  </div>
                )}
              </div>
              
              {job.estimated_completion_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium text-blue-600">{formatEstimatedTime(job.estimated_completion_time)}</span>
                </div>
              )}
              
              {job.retry_count !== undefined && job.retry_count > 0 && (
                <div className="text-sm text-amber-600">
                  Retries: {job.retry_count}{job.max_retries ? `/${job.max_retries}` : ''}
                </div>
              )}
            </div>
          )}

          {/* Cancellation Status */}
          {job.cancellation_requested && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <X className="h-4 w-4" />
                <span>Cancellation requested</span>
              </div>
              {job.cancelled_at && (
                <p className="text-xs text-red-600 mt-1">
                  {new Date(job.cancelled_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {Array.isArray(job?.error_messages) && job?.error_messages?.length > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <ul className="list-disc list-inside space-y-1">
                {job?.error_messages?.map((msg: string, idx: number) => (
                  <li key={idx} className="text-sm text-orange-800">{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {job.status === "running" && !job.cancellation_requested && (
              <Button 
                onClick={handleCancelJob}
                disabled={cancelling}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {cancelling ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {cancelling ? 'Cancelling...' : 'Cancel Job'}
              </Button>
            )}
            
            {( ["failed", "cancelled"].includes(job.status) ) && (
              <Button 
                onClick={() => onTrigger(job.job_type)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-cream cursor-pointer"
              >
                <Play className="h-4 w-4 mr-2 text-cream" />
                Restart Job
              </Button>
            )}
            {job.status === "completed" && (
              <Button 
                disabled
                className="flex-1 bg-gray-400 text-gray-600 cursor-not-allowed"
              >
                <Play className="h-4 w-4 mr-2" />
                Restart Job
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}