'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListEditorProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxItems?: number;
}

export function ListEditor({
  items,
  onItemsChange,
  placeholder = "Add item...",
  emptyMessage = "No items added yet",
  maxItems = 10
}: ListEditorProps) {
  const [newItem, setNewItem] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const addItem = () => {
    if (newItem.trim() && items.length < maxItems) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const updateItem = (index: number, value: string) => {
    const updatedItems = items.map((item, i) => i === index ? value : item);
    onItemsChange(updatedItems);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onItemsChange(newItems);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    moveItem(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3 px-2">
      {/* Add new item */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500"
          disabled={items.length >= maxItems}
        />
        <Button
          type="button"
          onClick={addItem}
          disabled={!newItem.trim() || items.length >= maxItems}
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Items list */}
      <div className="space-y-2 min-h-[100px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "group flex items-center gap-2 p-3 rounded-lg transition-all duration-200",
                "glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30",
                "hover:bg-white/20 dark:hover:bg-gray-800/20",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && draggedIndex !== index && "border-orange-500 bg-orange-500/10",
                "cursor-move"
              )}
            >
              {/* Drag handle */}
              <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Item input */}
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:border-none p-0 h-auto text-sm"
                placeholder="Enter text..."
              />

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-500/10 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Item count indicator */}
      {maxItems && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {items.length} / {maxItems} items
        </div>
      )}
    </div>
  );
}