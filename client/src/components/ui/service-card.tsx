import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-[#0D0F12] rounded-lg shadow-md border border-[#163253]/30 overflow-hidden transition-transform hover:translate-y-[-8px] hover:border-[#C8A466]/50">
      <div className="h-48 overflow-hidden">
        <img 
          src={service.imageUrl} 
          alt={service.title} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
        <p className="text-gray-300 mb-4">{service.description}</p>
        <div className="flex items-center">
          <Link 
            href={service.link}
            className="inline-flex items-center font-medium text-[#C8A466] hover:text-[#E8C476] transition-colors"
            data-testid={`link-service-${service.id}`}
          >
            Learn more
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
