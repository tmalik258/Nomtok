'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, FileText } from 'lucide-react';

export function QuickActionsCard() {
  return (
    <Card className="glass-effect backdrop-blur-xl bg-cream/80 border-orange-200/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-200">Quick Actions</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">Common dashboard operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 glass-effect backdrop-blur-sm bg-cream/60 border-orange-200/50 hover:bg-orange-50/80 hover:border-orange-300/60 focus:ring-orange-500 cursor-pointer">
            <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Sync Data</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 glass-effect backdrop-blur-sm bg-cream/60 border-orange-200/50 hover:bg-orange-50/80 hover:border-orange-300/60 focus:ring-orange-500 cursor-pointer">
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">View Analytics</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 glass-effect backdrop-blur-sm bg-cream/60 border-orange-200/50 hover:bg-orange-50/80 hover:border-orange-300/60 focus:ring-orange-500 cursor-pointer">
            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">View Reports</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}