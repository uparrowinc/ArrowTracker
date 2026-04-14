import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Folder, FolderPlus, Palette, Tag } from 'lucide-react';

interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  postCount: number;
  subcategories: BlogSubcategory[];
}

interface BlogSubcategory {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  postCount: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parentCategory?: string;
}

const ICON_OPTIONS = [
  'Cpu', 'Shield', 'Briefcase', 'ShoppingCart', 'Mic', 'Brain', 'Code', 'Settings', 
  'Target', 'Search', 'FileCheck', 'Users', 'Zap', 'Calendar', 'CreditCard', 
  'DollarSign', 'TrendingUp', 'Radio', 'Headphones', 'BookOpen', 'Database',
  'Globe', 'Lock', 'Monitor', 'Smartphone', 'Tablet', 'Wifi', 'Cloud'
];

const COLOR_OPTIONS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', 
  '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
];

export const CategoryManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: 'Folder',
    parentCategory: ''
  });

  const { data: categories = [], isLoading } = useQuery<BlogCategory[]>({
    queryKey: ['/api/blog/categories'],
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { originalSlug?: string }) => {
      return await apiRequest('/api/blog/categories', 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({ title: "Category updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await apiRequest('/api/blog/categories', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Category created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: 'Folder',
      parentCategory: ''
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleEditCategory = (category: BlogCategory, subcategory?: BlogSubcategory) => {
    const item = subcategory || category;
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description,
      color: item.color,
      icon: item.icon,
      parentCategory: subcategory ? category.slug : ''
    });
    setEditingCategory(item.slug);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ 
        ...formData, 
        originalSlug: editingCategory 
      });
    } else {
      createCategoryMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Category Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingCategory(null);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="category-slug"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Category description"
                />
              </div>
              <div>
                <Label htmlFor="parentCategory">Parent Category (for subcategories)</Label>
                <Select
                  value={formData.parentCategory}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCategory: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 text-white">
                    <SelectItem value="" className="text-white hover:bg-gray-700 focus:bg-gray-700">None (Main Category)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-white' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={updateCategoryMutation.isPending || createCategoryMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <Card key={category.slug} className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Folder className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{category.name}</CardTitle>
                    <p className="text-sm text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {category.postCount} posts
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCategory(category)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-300">Subcategories</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resetForm();
                      setFormData(prev => ({ ...prev, parentCategory: category.slug }));
                      setEditingCategory(null);
                      setIsDialogOpen(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                  >
                    <FolderPlus className="w-4 h-4 mr-1" />
                    Add Subcategory
                  </Button>
                </div>
                <div className="grid gap-2">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.slug} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: subcategory.color }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <span className="text-white font-medium">{subcategory.name}</span>
                          <p className="text-xs text-gray-400">{subcategory.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                          {subcategory.postCount}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category, subcategory)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {category.subcategories.length === 0 && (
                    <p className="text-gray-500 text-sm italic p-3">No subcategories yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};