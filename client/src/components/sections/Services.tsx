import { ServiceCard } from "@/components/ui/service-card";
import { Service } from "@shared/schema";
import ParallaxEffect from "@/components/parallax-effect";

interface ServicesProps {
  services: Service[];
}

export default function Services({ services }: ServicesProps) {
  // If no services are provided yet, use these default services
  const displayServices = services.length > 0 ? services : [
    {
      id: 1,
      title: "AI & Automation",
      description: "Implement custom AI solutions to streamline operations, enhance decision-making, and create more efficient business processes.",
      imageUrl: "https://images.unsplash.com/photo-1488229297570-58520851e868?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
      link: "/services/ai-automation"
    },
    {
      id: 2,
      title: "eCommerce Solutions",
      description: "Build scalable e-commerce systems with integrated payment, inventory, and customer management.",
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
      link: "/services/ecommerce-solutions"
    },
    {
      id: 3,
      title: "Business Strategy Consulting",
      description: "Develop scalable business strategies aligned with market trends and growth opportunities.",
      imageUrl: "https://images.unsplash.com/photo-1560439513-74b037a25d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
      link: "/services/business-strategy"
    }
  ];

  return (
    <section className="section-padding">
      <div className="container-wide">
        <span id="services-heading" className="block -mt-24 pt-24"></span>
        
        {/* Section Header with Beautiful Spacing */}
        <div className="text-center mb-20">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
                Our Professional Services
              </span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#163253] to-[#C8A466] mx-auto mb-8"></div>
          </div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            I offer comprehensive consulting and implementation services to help your business leverage technology for sustainable growth.
          </p>
        </div>
        
        {/* Services Grid with Enhanced Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {displayServices
            .sort((a, b) => {
              if (a.title.includes("AI & Automation")) return -1;
              if (b.title.includes("AI & Automation")) return 1;
              return 0;
            })
            .map((service, index) => (
              <div 
                key={service.id} 
                className="card-hover group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ServiceCard service={service} />
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}
