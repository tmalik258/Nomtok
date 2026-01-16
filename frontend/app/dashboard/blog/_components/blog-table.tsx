"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogPost } from "@/lib/types";
import { BlogTableRow } from "./blog-table-row";

interface BlogTableProps {
  blogs: BlogPost[];
  onEdit: (blog: BlogPost) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  isTogglingPublish?: string | null;
}

export function BlogTable({
  blogs,
  onEdit,
  onDelete,
  onTogglePublish,
  isTogglingPublish,
}: BlogTableProps) {
  return (
    <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
              <TableHead className="font-semibold text-foreground">
                Title
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Categories
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Published
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Created
              </TableHead>
              <TableHead className="font-semibold text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.map((blog) => (
              <BlogTableRow
                key={blog.id}
                blog={blog}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePublish={onTogglePublish}
                isTogglingPublish={isTogglingPublish === blog.id}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
