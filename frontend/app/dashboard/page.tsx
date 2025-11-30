import { Suspense } from 'react';
import DashboardContent from '@/app/dashboard/_components/dashboard-content';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function DashboardPage() {
  return (
    <div className="space-y-6 dark:bg-black rounded-lg p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-cream">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your platform&apos;s performance and key metrics
        </p>
      </div>
      
      <Suspense fallback={<DashboardLoadingSkeleton variant="analytics" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}