"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/lib/types";
import { Edit, Trash2, Eye, EyeOff, Star, StarOff } from "lucide-react";
import { format } from "date-fns";

interface BlogTableRowProps {
  blog: BlogPost;
  onEdit: (blog: BlogPost) => void;
  onDelete: (id: string) => void;
}

export function BlogTableRow({
  blog,
  onEdit,
  onDelete,
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
          {blog.is_published ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 w-fit">
              <Eye className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-fit">
              <EyeOff className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          )}
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
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(blog)}
            className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer"
            aria-label={`Edit ${blog.title}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(blog.id)}
            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
            aria-label={`Delete ${blog.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
