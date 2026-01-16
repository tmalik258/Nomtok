"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlogPost } from "@/lib/types";
import { Edit, Trash2, Star, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface BlogTableRowProps {
  blog: BlogPost;
  onEdit: (blog: BlogPost) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  isTogglingPublish?: boolean;
}

export function BlogTableRow({
  blog,
  onEdit,
  onDelete,
  onTogglePublish,
  isTogglingPublish = false,
}: BlogTableRowProps) {
  return (
    <TableRow className="border-orange-500/20 hover:bg-orange-500/5 transition-colors">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="truncate max-w-md">{blog.title}</span>
          {blog.excerpt && (
            <span className="text-xs text-muted-foreground truncate max-w-md mt-1">
              {blog.excerpt}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                blog.is_published ? "bg-green-500" : "bg-red-500"
              }`}
              title={blog.is_published ? "Published" : "Not Published"}
            />
            <span className="text-sm font-medium">
              {blog.is_published ? "Published" : "Draft"}
            </span>
          </div>
          {blog.is_featured && (
            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 w-fit mt-1">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {blog.categories && blog.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {blog.categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs">
                {category.name}
              </Badge>
            ))}
            {blog.categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{blog.categories.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No categories</span>
        )}
      </TableCell>
      <TableCell>
        {blog.published_at ? (
          <span className="text-sm">
            {format(new Date(blog.published_at), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Not published</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {format(new Date(blog.created_at), "MMM d, yyyy")}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                aria-label={`Actions for ${blog.title}`}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onEdit(blog)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onTogglePublish(blog.id)}
                disabled={isTogglingPublish}
                className="cursor-pointer"
              >
                {isTogglingPublish ? (
                  <>
                    <MoreVertical className="h-4 w-4 mr-2 animate-spin" />
                    {blog.is_published ? "Unpublishing..." : "Publishing..."}
                  </>
                ) : blog.is_published ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(blog.id)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
