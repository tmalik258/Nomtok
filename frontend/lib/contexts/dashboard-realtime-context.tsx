"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { Job } from "@/lib/types/api";
import { useJobsRealtime } from "@/lib/hooks/useJobsRealtime";

type JobEventType = "create" | "update" | "delete";

interface JobEvent {
  type: JobEventType;
  job?: Job;
  jobId?: string;
  timestamp: number;
}

interface DashboardRealtimeContextValue {
  version: number;
  lastEvent: JobEvent | null;
  jobs: Map<string, Job>;
  getJob: (jobId: string) => Job | undefined;
}

const DashboardRealtimeContext = createContext<DashboardRealtimeContextValue | undefined>(undefined);

export const DashboardRealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [version, setVersion] = useState(0);
  const [lastEvent, setLastEvent] = useState<JobEvent | null>(null);
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());

  const onJobUpdate = useCallback((job: Job) => {
    setLastEvent({ type: "update", job, timestamp: Date.now() });
    setVersion((v) => v + 1);
    
    // Update job in map
    setJobsMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(job.id, job);
      return newMap;
    });
  }, []);

  const onJobCreate = useCallback((job: Job) => {
    setLastEvent({ type: "create", job, timestamp: Date.now() });
    setVersion((v) => v + 1);
    
    // Add job to map
    setJobsMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(job.id, job);
      return newMap;
    });
  }, []);

  const onJobDelete = useCallback((jobId: string) => {
    setLastEvent({ type: "delete", jobId, timestamp: Date.now() });
    setVersion((v) => v + 1);
    
    // Remove job from map
    setJobsMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });
  }, []);

  useJobsRealtime({ onJobUpdate, onJobCreate, onJobDelete });

  const getJob = useCallback((jobId: string): Job | undefined => {
    return jobsMap.get(jobId);
  }, [jobsMap]);

  const value = useMemo(() => ({ 
    version, 
    lastEvent, 
    jobs: jobsMap,
    getJob
  }), [version, lastEvent, jobsMap, getJob]);

  return (
    <DashboardRealtimeContext.Provider value={value}>
      {children}
    </DashboardRealtimeContext.Provider>
  );
};

export const useDashboardRealtime = (): DashboardRealtimeContextValue => {
  const ctx = useContext(DashboardRealtimeContext);
  if (!ctx) {
    throw new Error("useDashboardRealtime must be used within DashboardRealtimeProvider");
  }
  return ctx;
};