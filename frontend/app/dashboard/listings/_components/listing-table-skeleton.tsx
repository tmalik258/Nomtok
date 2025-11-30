import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MapPin, User, Video, TrendingUp, Calendar, Hash } from "lucide-react";

// Loading skeleton for table content
const ListingTableSkeleton = ({itemsPerPage = 10}: {itemsPerPage: number}) => (
  <Card className="glass-effect backdrop-blur-xl bg-cream/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 p-0">
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Id
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Restaurant
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Influencer
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Video
              </div>
            </TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-32">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Confidence
              </div>
            </TableHead>
            <TableHead className="w-32">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Visit Date
              </div>
            </TableHead>
            <TableHead className="w-32">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Created
              </div>
            </TableHead>
            <TableHead className="w-48 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: itemsPerPage || 10 }).map((_, index) => (
            <TableRow
              key={index}
              className="border-b border-white/10 dark:border-gray-700/30"
            >
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default ListingTableSkeleton;
