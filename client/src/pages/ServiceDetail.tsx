import { useParams, Link } from "wouter";
import { ArrowLeft, CheckCircle, ArrowRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceData {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  benefits: string[];
  approach: {
    title: string;
    description: string;
  }[];
  outcomes: string[];
  ctaText: string;
}

const servicesData: Record<string, ServiceData> = {
  "ai-automation": {
    slug: "ai-automation",
    title: "AI & Automation",
    subtitle: "Transform Your Operations with Intelligent Solutions",
    heroDescription: "Leverage cutting-edge artificial intelligence and automation technologies to streamline operations, enhance decision-making, and create sustainable competitive advantages.",
    benefits: [
      "Reduce operational costs by automating repetitive tasks",
      "Enhance decision-making with data-driven AI insights",
      "Improve customer experience with intelligent chatbots and support",
      "Accelerate business processes with workflow automation",
      "Gain predictive capabilities for proactive business planning"
    ],
    approach: [
      {
        title: "Discovery & Assessment",
        description: "We analyze your current processes to identify high-impact automation opportunities and AI use cases specific to your business."
      },
      {
        title: "Strategy & Roadmap",
        description: "Develop a phased implementation plan that prioritizes quick wins while building toward transformative AI capabilities."
      },
      {
        title: "Implementation",
        description: "Deploy AI and automation solutions using proven methodologies, ensuring seamless integration with existing systems."
      },
      {
        title: "Optimization & Scale",
        description: "Continuously monitor, refine, and expand AI capabilities to maximize ROI and business value."
      }
    ],
    outcomes: [
      "40-60% reduction in manual processing time",
      "Improved accuracy and consistency in operations",
      "Enhanced employee productivity and satisfaction",
      "Data-driven insights for strategic decisions",
      "Scalable solutions that grow with your business"
    ],
    ctaText: "Explore AI Solutions"
  },
  "ecommerce-solutions": {
    slug: "ecommerce-solutions",
    title: "eCommerce Solutions",
    subtitle: "Build Scalable Digital Commerce Platforms",
    heroDescription: "Create powerful, conversion-optimized eCommerce experiences with integrated payment processing, inventory management, and customer engagement tools.",
    benefits: [
      "Launch or upgrade your online store with modern technology",
      "Integrate seamless payment processing and checkout",
      "Automate inventory and order management",
      "Create personalized customer experiences",
      "Scale your commerce infrastructure on demand"
    ],
    approach: [
      {
        title: "Commerce Assessment",
        description: "Evaluate your current digital commerce capabilities, customer journey, and technology stack to identify opportunities."
      },
      {
        title: "Platform Strategy",
        description: "Design the optimal commerce architecture using best-fit platforms and custom integrations for your unique needs."
      },
      {
        title: "Build & Launch",
        description: "Develop your commerce solution with a focus on user experience, performance, and conversion optimization."
      },
      {
        title: "Growth & Optimization",
        description: "Implement analytics, A/B testing, and continuous improvements to maximize sales and customer lifetime value."
      }
    ],
    outcomes: [
      "Increased online revenue and conversion rates",
      "Reduced cart abandonment through optimized checkout",
      "Unified commerce across all sales channels",
      "Automated fulfillment and inventory management",
      "Enhanced customer loyalty and repeat purchases"
    ],
    ctaText: "Launch Your Store"
  },
  "business-strategy": {
    slug: "business-strategy",
    title: "Business Strategy Consulting",
    subtitle: "Navigate Growth with Expert Guidance",
    heroDescription: "Develop scalable business strategies aligned with market trends, emerging technologies, and sustainable growth opportunities tailored to your organization.",
    benefits: [
      "Clarify vision and align organizational objectives",
      "Identify new market opportunities and revenue streams",
      "Optimize operations for efficiency and scalability",
      "Build competitive advantages through technology",
      "Prepare for market changes with adaptive strategies"
    ],
    approach: [
      {
        title: "Strategic Assessment",
        description: "Conduct comprehensive analysis of your business, market position, competitive landscape, and growth potential."
      },
      {
        title: "Vision & Planning",
        description: "Collaborate to define strategic objectives, key initiatives, and measurable success criteria."
      },
      {
        title: "Execution Framework",
        description: "Create actionable roadmaps with clear milestones, resource requirements, and accountability structures."
      },
      {
        title: "Implementation Support",
        description: "Provide ongoing guidance and advisory to ensure successful execution and course correction as needed."
      }
    ],
    outcomes: [
      "Clear strategic direction and organizational alignment",
      "Identified growth opportunities and prioritized initiatives",
      "Improved operational efficiency and resource allocation",
      "Stronger competitive positioning in your market",
      "Measurable progress toward business objectives"
    ],
    ctaText: "Start Planning"
  }
};

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? servicesData[slug] : null;

  if (!service) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Service Not Found</h1>
          <p className="text-gray-400 mb-8">The service you're looking for doesn't exist.</p>
          <Link href="/">
            <Button className="bg-[#163253] hover:bg-[#2C4A6E] text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D10]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#163253]/20 to-transparent"></div>
        
        {/* uAI Brain Logo - Desktop Left Side Call-out */}
        <div className="hidden lg:block absolute left-8 xl:left-16 top-32 z-0">
          <img 
            src="/attached_assets/image_1753753865238.png" 
            alt="uAI - AI Intelligence Hub" 
            className="w-64 h-64 xl:w-80 xl:h-80 opacity-50 hover:opacity-70 transition-opacity duration-300"
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <Link href="/#services">
            <span className="inline-flex items-center text-[#C8A466] hover:text-[#E8C476] mb-6 cursor-pointer transition-colors" data-testid="link-back-services">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </span>
          </Link>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6" data-testid="text-service-title">
            <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
              {service.title}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#C8A466] mb-6" data-testid="text-service-subtitle">
            {service.subtitle}
          </p>
          
          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed" data-testid="text-service-description">
            {service.heroDescription}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-[#0D0F12]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Key Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {service.benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 bg-[#0B0D10] border border-[#163253]/30 rounded-lg"
                data-testid={`benefit-item-${index}`}
              >
                <CheckCircle className="w-6 h-6 text-[#C8A466] flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Our Approach
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {service.approach.map((step, index) => (
              <div key={index} className="relative" data-testid={`approach-step-${index}`}>
                <div className="text-5xl font-bold text-[#163253]/50 mb-4">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400">
                  {step.description}
                </p>
                {index < service.approach.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-[#163253]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes Section */}
      <section className="py-16 md:py-24 bg-[#0D0F12]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Expected Outcomes
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.outcomes.map((outcome, index) => (
              <div 
                key={index}
                className="p-6 bg-gradient-to-br from-[#163253]/20 to-[#0B0D10] border border-[#163253]/30 rounded-lg"
                data-testid={`outcome-item-${index}`}
              >
                <p className="text-gray-300">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Let's discuss how {service.title.toLowerCase()} can transform your business. 
              Schedule a consultation to explore your specific needs and opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contact">
                <Button 
                  size="lg" 
                  className="bg-[#C8A466] hover:bg-[#B89356] text-[#0B0D10] font-semibold px-8"
                  data-testid="button-contact-cta"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </Link>
              <Link href="/#about">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-[#163253] text-white hover:bg-[#163253]/20"
                  data-testid="button-about-cta"
                >
                  Learn About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
