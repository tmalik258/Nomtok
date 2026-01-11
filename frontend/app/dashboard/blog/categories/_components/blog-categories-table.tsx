"use client";

import { BlogCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface BlogCategoriesTableProps {
  categories: BlogCategory[];
  onEdit: (category: BlogCategory) => void;
  onDelete: (id: string) => void;
}

export function BlogCategoriesTable({
  categories,
  onEdit,
  onDelete,
}: BlogCategoriesTableProps) {
  return (
    <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
              <TableHead className="font-semibold text-foreground">Name</TableHead>
              <TableHead className="font-semibold text-foreground">Slug</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="border-orange-500/20 hover:bg-orange-500/5">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(category)}
                        className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(category.id)}
                        className="h-8 w-8 hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
