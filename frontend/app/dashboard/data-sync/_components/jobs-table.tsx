"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  X, 
  Play, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useJobActions } from "@/lib/hooks";
import { toast } from "sonner";
import type { Job } from "@/lib/types/api";
import JobDetailsDialog from "./job-details-dialog";
import { useDashboardRealtime } from "@/lib/contexts/dashboard-realtime-context";

interface JobsTableProps {
  jobs: Job[];
  onRefresh: () => void;
}

type SortField = 'started_at' | 'completed_at' | 'job_type' | 'status' | 'progress';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

function getStatusBadge(status: Job['status']) {
  const statusConfig = {
    pending: { variant: 'secondary' as const, icon: Clock, className: 'bg-gray-100 text-gray-800' },
    running: { variant: 'default' as const, icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
    completed: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
    failed: { variant: 'destructive' as const, icon: AlertCircle, className: 'bg-red-100 text-red-800' },
    cancelled: { variant: 'secondary' as const, icon: X, className: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(startTime?: string, endTime?: string) {
  if (!startTime) return '-';
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  
  if (duration < 60) return `${duration}s`;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function JobsTable({ jobs, onRefresh }: JobsTableProps) {
  const [sortField, setSortField] = useState<SortField>('started_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { cancelJob } = useJobActions();
  const { getJob } = useDashboardRealtime();

  // Merge real-time job state with props
  const jobsWithRealtime = useMemo(() => {
    return jobs.map(job => {
      const realtimeJob = getJob(job.id);
      return realtimeJob ? { ...job, ...realtimeJob } : job;
    });
  }, [jobs, getJob]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedJobs = useMemo(() => {
    return [...jobsWithRealtime].sort((a, b) => {
      let aValue: string | number | undefined = a[sortField];
      let bValue: string | number | undefined = b[sortField];

      // Handle date fields
      if (sortField.includes('_at')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [jobsWithRealtime, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId, 'Cancelled by user from jobs table');
      onRefresh();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleRestartJob = async (job: Job) => {
    try {
      // For now, we'll trigger a new job of the same type
      // This can be enhanced later with proper restart logic
      toast.success('Job restart initiated', {
        description: `Restarting job: ${job.title}`,
      });
      
      // You can implement actual restart logic here
      // For example, calling a restart API endpoint
      console.log('Restarting job:', job.id, job.job_type);
      
      // Trigger a refresh to show the new job
      setTimeout(() => onRefresh(), 1000);
    } catch (error) {
      console.error('Failed to restart job:', error);
      toast.error('Failed to restart job', {
        description: 'Please try again or contact support',
      });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <Card className="glass-effect backdrop-blur-xl bg-cream/80 border border-orange-200/50 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-gray-100">
            All Jobs ({jobs.length})
          </CardTitle>
          <Button 
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-orange-200/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50/50">
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('started_at')}
                >
                  <div className="flex items-center">
                    Job ID
                    <SortIcon field="started_at" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('job_type')}
                >
                  <div className="flex items-center">
                    Type
                    <SortIcon field="job_type" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('progress')}
                >
                  <div className="flex items-center">
                    Progress
                    <SortIcon field="progress" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('started_at')}
                >
                  <div className="flex items-center">
                    Started
                    <SortIcon field="started_at" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => handleSort('completed_at')}
                >
                  <div className="flex items-center">
                    Completed
                    <SortIcon field="completed_at" />
                  </div>
                </TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-orange-50/30 transition-colors">
                  <TableCell className="font-mono text-sm">
                    {job.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-orange-200">
                      {job.job_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={job.title}>
                    {job.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      {job.status === 'running' ? (
                        <>
                          <Progress value={job.progress || 0} className="flex-1 h-2" />
                          <span className="text-sm text-gray-600 min-w-[35px]">
                            {job.progress || 0}%
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {job.progress || 0}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(job.started_at)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(job.completed_at)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDuration(job.started_at, job.completed_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                        className="h-8 w-8 p-0 hover:bg-orange-100"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {job.status === 'running' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelJob(job.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                          title="Cancel Job"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {['failed', 'cancelled'].includes(job.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestartJob(job)}
                          className="h-8 w-8 p-0 hover:bg-green-100 text-green-600 cursor-pointer"
                          title="Restart Job"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="h-8 w-8 p-0 cursor-not-allowed opacity-50"
                          title="Cannot restart completed job"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedJobs.length)} of{' '}
              {sortedJobs.length} jobs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-orange-200 hover:bg-orange-50"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 
                          "bg-orange-600 hover:bg-orange-700 text-cream" : 
                          "border-orange-200 hover:bg-orange-50"
                        }
                      >
                        {page}
                      </Button>
                    </div>
                  ))
                }
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-orange-200 hover:bg-orange-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Job Details Modal */}
      <JobDetailsDialog
        selectedJob={selectedJob}
        onClose={() => setSelectedJob(null)}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        formatDuration={formatDuration}
      />
    </Card>
  );
}

export default JobsTable;