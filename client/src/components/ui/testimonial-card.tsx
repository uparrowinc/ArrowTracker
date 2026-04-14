import { Star } from "lucide-react";
import { Testimonial } from "@shared/schema";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-8 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="text-white flex">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-current" />
          ))}
        </div>
      </div>
      <blockquote className="mb-6 flex-grow">
        <p className="text-white italic">
          "{testimonial.content}"
        </p>
      </blockquote>
      <div className="flex items-center">
        <div className="mr-4 w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
          <img 
            src={testimonial.authorImageUrl} 
            alt={testimonial.authorName} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium text-white">{testimonial.authorName}</p>
          <p className="text-sm text-gray-300">{testimonial.authorTitle}</p>
        </div>
      </div>
    </div>
  );
}
