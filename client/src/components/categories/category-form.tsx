import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCategorySchema, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CategoryFormProps = {
  onSuccess: () => void;
  categoryToEdit?: Category;
};

const formSchema = insertCategorySchema.pick({
  name: true,
  color: true,
}).extend({
  name: z.string().min(1, "Category name is required"),
  color: z.string().min(4, "Color is required").regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color"),
});

export function CategoryForm({ onSuccess, categoryToEdit }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!categoryToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: categoryToEdit?.name || "",
      color: categoryToEdit?.color || "#1A73E8",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "Your category has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("PUT", `/api/categories/${categoryToEdit?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "Your category has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">
          {isEditing ? 'Edit Category' : 'Add New Category'}
        </h3>
      </div>
      
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Office Supplies, Travel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Color</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input type="color" {...field} className="w-12 h-10 p-1" />
                    </FormControl>
                    <FormControl>
                      <Input {...field} placeholder="#000000" />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Choose a color for this category. This will be used to identify it in charts and lists.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" type="button" onClick={onSuccess}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Category' : 'Save Category'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
