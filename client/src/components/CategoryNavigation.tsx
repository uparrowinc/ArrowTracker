import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Cpu, Shield, Briefcase, ShoppingCart, Mic, Brain, Code, Settings, Target, Search, FileCheck, Users, Zap, Calendar, CreditCard, DollarSign, TrendingUp, Radio, Headphones, BookOpen } from 'lucide-react';

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

interface CategoryNavigationProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect: (category?: string, subcategory?: string) => void;
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Cpu, Shield, Briefcase, ShoppingCart, Mic, Brain, Code, Settings, Target, Search, FileCheck, Users, Zap, Calendar, CreditCard, DollarSign, TrendingUp, Radio, Headphones, BookOpen
};

export const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading } = useQuery<BlogCategory[]>({
    queryKey: ['/api/blog/categories'],
  });

  const toggleCategory = (categorySlug: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categorySlug)) {
      newExpanded.delete(categorySlug);
    } else {
      newExpanded.add(categorySlug);
    }
    setExpandedCategories(newExpanded);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Cpu className="w-4 h-4" />;
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
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C8A466]" />
          Blog Categories
        </h3>

        {/* All Posts Button */}
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          className={`w-full justify-start mb-4 ${
            !selectedCategory 
              ? "bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] text-white border border-[#C8A466]/20 shadow-lg" 
              : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCategorySelect();
          }}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          All Posts
          <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-300">
            {categories.reduce((total, cat) => total + cat.postCount, 0)}
          </Badge>
        </Button>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.slug}>
              <Collapsible
                open={expandedCategories.has(category.slug)}
                onOpenChange={() => toggleCategory(category.slug)}
              >
                <div className="flex items-center">
                  <Button
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    className={`flex-1 justify-start mr-2 ${
                      selectedCategory === category.slug
                        ? "text-gray-900 font-semibold border-0 shadow-lg"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                    style={selectedCategory === category.slug ? {
                      background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    } : {}}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Auto-expand category when selected
                      if (selectedCategory !== category.slug && category.subcategories.length > 0) {
                        const newExpanded = new Set(expandedCategories);
                        newExpanded.add(category.slug);
                        setExpandedCategories(newExpanded);
                      }
                      onCategorySelect(category.slug);
                    }}
                  >
                    {getIcon(category.icon)}
                    <span className="ml-2 flex-1 text-left">{category.name}</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${
                        selectedCategory === category.slug
                          ? "bg-blue-900/30 text-gray-900 border-blue-900/50" 
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {category.postCount}
                    </Badge>
                  </Button>
                  
                  {category.subcategories.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-800 p-2"
                      >
                        {expandedCategories.has(category.slug) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                <CollapsibleContent className="ml-6 mt-2 space-y-1">
                  {category.subcategories.map((subcategory) => (
                    <Button
                      key={subcategory.slug}
                      variant={selectedSubcategory === subcategory.slug ? "default" : "outline"}
                      className={`w-full justify-start text-sm ${
                        selectedSubcategory === subcategory.slug
                          ? "text-gray-900 font-semibold border-0 shadow-lg"
                          : "border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                      style={selectedSubcategory === subcategory.slug ? {
                        background: 'linear-gradient(135deg, #10B981, #34D399)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      } : {}}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCategorySelect(category.slug, subcategory.slug);
                      }}
                    >
                      {getIcon(subcategory.icon)}
                      <span className="ml-2 flex-1 text-left">{subcategory.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 text-xs ${
                          selectedSubcategory === subcategory.slug 
                            ? "bg-green-900/30 text-gray-900 border-green-900/50" 
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {subcategory.postCount}
                      </Badge>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        {selectedCategory && (
          <div 
            className={`mt-6 p-4 rounded-lg shadow-lg transition-all duration-300 ${
              selectedSubcategory 
                ? "text-gray-900 border-0" 
                : "text-gray-900 border-0"
            }`}
            style={selectedSubcategory ? {
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            } : {
              background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="mb-2">
              {(() => {
                const category = categories.find(cat => cat.slug === selectedCategory);
                const subcategory = selectedSubcategory ? 
                  category?.subcategories.find(sub => sub.slug === selectedSubcategory) : null;
                
                return (
                  <>
                    {/* Breadcrumb navigation */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      {selectedSubcategory && category && subcategory ? (
                        <>
                          <span className="font-medium text-gray-900/70">
                            {category.name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-900/50" />
                          <span className="font-medium text-gray-900">
                            {subcategory.name}
                          </span>
                        </>
                      ) : category ? (
                        <>
                          <span className="font-medium text-gray-900/70">
                            All Categories
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-900/50" />
                          <span className="font-medium text-gray-900">
                            {category.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                    
                    {/* Main title with icon */}
                    <div className="flex items-center gap-2">
                      {getIcon((subcategory || category)?.icon || 'Folder')}
                      <h4 className="font-semibold text-lg text-gray-900">
                        {(subcategory || category)?.name}
                      </h4>
                    </div>
                  </>
                );
              })()}
            </div>
            <p className="text-sm text-gray-900/80">
              {(() => {
                const category = categories.find(cat => cat.slug === selectedCategory);
                const subcategory = selectedSubcategory ? 
                  category?.subcategories.find(sub => sub.slug === selectedSubcategory) : null;
                return (subcategory || category)?.description;
              })()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};