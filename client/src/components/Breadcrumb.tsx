import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// Category display names mapping
const categoryDisplayNames: Record<string, string> = {
  'ecommerce': 'E-Commerce',
  'consulting': 'Consulting',
  'development': 'Development',
  'security': 'Security',
  'technology': 'Technology',
  'general': 'General',
  'ai': 'AI & Machine Learning',
  'cloud': 'Cloud Solutions'
};

// Subcategory display names mapping
const subcategoryDisplayNames: Record<string, string> = {
  'pci-compliance': 'PCI Compliance',
  'ssl-certificates': 'SSL Certificates',
  'payment-gateway': 'Payment Gateway',
  'digital-transformation': 'Digital Transformation',
  'cloud-migration': 'Cloud Migration',
  'api-integration': 'API Integration',
  'web-applications': 'Web Applications',
  'cybersecurity': 'Cybersecurity',
  'seo': 'SEO & Marketing',
  'analytics': 'Analytics',
  'automation': 'Automation',
  'ai-machine-learning': 'AI & Machine Learning'
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const formatLabel = (label: string, isCategory = false, isSubcategory = false) => {
    if (isCategory) {
      return categoryDisplayNames[label] || label.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (isSubcategory) {
      if (subcategoryDisplayNames[label]) {
        return subcategoryDisplayNames[label];
      }
      // Handle acronyms when transforming slugs
      return label.split('-').map(word => {
        const acronyms = ['ai', 'api', 'ssl', 'seo', 'ui', 'ux', 'pci', 'sql', 'xml', 'json', 'html', 'css', 'js'];
        if (acronyms.includes(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
    }
    return label;
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-400 mb-6 ${className}`} aria-label="Breadcrumb">
      <Link href="/" className="flex items-center hover:text-white transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4 text-gray-500" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-white transition-colors hover:underline"
            >
              {formatLabel(
                item.label,
                index === 1, // Second item is usually category
                index === 2  // Third item is usually subcategory
              )}
            </Link>
          ) : (
            <span className="text-white">
              {formatLabel(
                item.label,
                index === 1,
                index === 2
              )}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Helper function to generate breadcrumbs from blog post data
export function generateBlogBreadcrumbs(
  category?: string | null,
  subcategory?: string | null,
  title?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Blog", href: "/blog" }
  ];

  if (category && category !== 'general') {
    breadcrumbs.push({
      label: category,
      href: `/blog/category/${category}`
    });
  }

  if (subcategory) {
    breadcrumbs.push({
      label: subcategory,
      href: `/blog/category/${category}/${subcategory}`
    });
  }

  if (title) {
    breadcrumbs.push({
      label: title
    });
  }

  return breadcrumbs;
}

// Category navigation component for blog sidebar
export function CategoryNavigation() {
  const categories = [
    { slug: 'ecommerce', name: 'E-Commerce', count: 12, subcategories: [
      { slug: 'pci-compliance', name: 'PCI Compliance' },
      { slug: 'ssl-certificates', name: 'SSL Certificates' },
      { slug: 'payment-gateway', name: 'Payment Gateway' },
      { slug: 'seo', name: 'SEO & Marketing' }
    ]},
    { slug: 'consulting', name: 'Consulting', count: 8, subcategories: [
      { slug: 'digital-transformation', name: 'Digital Transformation' },
      { slug: 'cloud-migration', name: 'Cloud Migration' },
      { slug: 'cybersecurity', name: 'Cybersecurity' }
    ]},
    { slug: 'development', name: 'Development', count: 15, subcategories: [
      { slug: 'api-integration', name: 'API Integration' },
      { slug: 'web-applications', name: 'Web Applications' },
      { slug: 'automation', name: 'Automation' }
    ]},
    { slug: 'security', name: 'Security', count: 6, subcategories: [
      { slug: 'cybersecurity', name: 'Cybersecurity' },
      { slug: 'pci-compliance', name: 'PCI Compliance' }
    ]}
  ];

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
      
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.slug} className="group">
            <Link 
              href={`/blog/category/${category.slug}`}
              className="flex items-center justify-between text-gray-300 hover:text-white transition-colors"
            >
              <span>{category.name}</span>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{category.count}</span>
            </Link>
            
            {category.subcategories && (
              <div className="ml-4 mt-2 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/blog/category/${category.slug}/${sub.slug}`}
                    className="block text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}