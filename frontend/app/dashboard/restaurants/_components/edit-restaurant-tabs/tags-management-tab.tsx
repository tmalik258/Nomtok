"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, X, Tag, Search } from "lucide-react";
import { Restaurant, Tag as TagType } from "@/lib/types";
import { toast } from "sonner";
import { useTags } from "@/lib/hooks";
import { tagActions } from "@/lib/actions";
import { adminApi } from "@/lib/api";

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
});

type TagFormData = z.infer<typeof tagSchema>;

interface TagsManagementTabProps {
  restaurant: Restaurant;
  onSuccess: () => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function TagsManagementTab({
  restaurant,
  onSuccess,
  onUnsavedChanges,
}: TagsManagementTabProps) {
  const [tags, setTags] = useState<TagType[]>(restaurant.tags || []);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
    },
  });

  const { tags: allTags, loading: tagsLoading, error: tagsError, fetchAllTags } = useTags();

  // Check for unsaved changes
  useEffect(() => {
    const originalTagIds = new Set(restaurant.tags?.map((t) => t.id) || []);
    const currentTagIds = new Set(tags.map((t) => t.id));

    const hasChanges =
      originalTagIds.size !== currentTagIds.size ||
      [...originalTagIds].some((id) => !currentTagIds.has(id));

    onUnsavedChanges(hasChanges);
  }, [tags, restaurant.tags, onUnsavedChanges]);

  // Fetch all tags once on mount
  useEffect(() => {
    fetchAllTags(200);
  }, [fetchAllTags]);
  
  // Derive available tags whenever assigned tags or all tags change
  useEffect(() => {
    const assignedTagIds = new Set(tags.map((t) => t.id));
    const source = Array.isArray(allTags) ? allTags : [];
    const filtered = source.filter((t) => !assignedTagIds.has(t.id));
    setAvailableTags(filtered);
  }, [tags, allTags]);

  const handleAddTag = (tag: TagType) => {
    setTags((prev) => [...prev, tag]);
  };

  const handleRemoveTag = (tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async (data: TagFormData) => {
    try {
      const created = await tagActions.createTag({ name: data.name });
      setTags((prev) => [...prev, created]);
      form.reset();
      toast.success(`Tag "${data.name}" created and added`);
    } catch (error) {
      console.log("Failed to create tag:", error);
      toast.error("Failed to create tag");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tag_ids = tags.map((t) => t.id);
      await adminApi.put(`/restaurants/${restaurant.id}/tags/`, { tag_ids });
      toast.success("Tags updated successfully");
      onSuccess();
    } catch (error) {
      console.log("Failed to update tags:", error);
      toast.error("Failed to update tags");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTags(restaurant.tags || []);
    onUnsavedChanges(false);
  };

  const filteredAvailableTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-6 space-y-6">
      {/* Current Tags */}
      <Card className="glass-effect border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-orange-500" />
            Current Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  className={`bg-orange-600 hover:bg-orange-700 text-cream px-3 py-1 text-sm flex items-center gap-2`}
                >
                  {tag.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="h-4 w-4 p-0 hover:bg-black/20 text-cream"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No tags assigned. Add tags from the available options below to
              help categorize this restaurant.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Add Available Tags */}
      <Card className="glass-effect border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Add Tags</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search available tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-auto">
          {tagsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-2 text-muted-foreground">Loading tags...</span>
            </div>
          ) : filteredAvailableTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredAvailableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10 cursor-pointer px-3 py-1 text-sm flex items-center gap-2 transition-colors"
                  onClick={() => handleAddTag(tag)}
                >
                  <Plus className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {searchTerm
                ? "No tags found matching your search."
                : tagsError
                ? "Failed to load tags."
                : "No available tags to add."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create New Tag */}
      <Card className="glass-effect border-orange-500/20">
        <CardHeader>
          <CardTitle className="text-lg">Create New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateTag)}
              className="flex gap-3"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Enter new tag name"
                        {...field}
                        className="focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-cream"
                disabled={!form.formState.isValid}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create & Add
              </Button>
            </form>
          </Form>
          <p className="text-xs text-muted-foreground mt-2">
            Tags help categorize restaurants and make them easier to discover.
            Keep them short and descriptive.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="hover:bg-muted/50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 text-cream"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
