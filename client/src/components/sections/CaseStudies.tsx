import { useEffect, useState, useRef } from "react";
import { TestimonialCard } from "@/components/ui/testimonial-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Testimonial } from "@shared/schema";

interface CaseStudiesProps {
  testimonials: Testimonial[];
}

export default function CaseStudies({ testimonials }: CaseStudiesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // If no testimonials are provided yet, use these default testimonials
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      id: 1,
      content: "up arrow inc's AI solution transformed our customer service operations, reducing response times by 68% while increasing customer satisfaction scores by 45%. Their team provided exceptional support throughout implementation.",
      authorName: "Sarah Johnson",
      authorTitle: "CTO, TechVision Global",
      authorImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
      rating: 5
    },
    {
      id: 2,
      content: "The commerce solution implemented by up arrow inc increased our online sales by 120% in just six months. Their strategic approach to digital transformation has been instrumental to our growth.",
      authorName: "David Chen",
      authorTitle: "CEO, RetailNow Inc",
      authorImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
      rating: 5
    },
    {
      id: 3,
      content: "UpArrow's business strategy consulting helped us pivot during challenging market conditions. Their data-driven approach identified new opportunities we hadn't considered, resulting in 35% year-over-year growth.",
      authorName: "Amanda Rodriguez",
      authorTitle: "COO, FinServe Solutions",
      authorImageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
      rating: 5
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      // Set slides per view based on window width
      if (window.innerWidth < 768) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 1024) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(3);
      }
    };

    // Initialize on mount
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const totalSlides = displayTestimonials.length;
  const maxSlide = Math.max(0, totalSlides - slidesPerView);

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(maxSlide, prev + 1));
  };

  // Update slider position when currentSlide changes
  useEffect(() => {
    if (sliderRef.current) {
      const translateValue = -currentSlide * (100 / slidesPerView);
      sliderRef.current.style.transform = `translateX(${translateValue}%)`;
    }
  }, [currentSlide, slidesPerView]);

  return (
    <section className="py-12 md:py-16 bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">success stories</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            See how our clients have achieved remarkable results through our strategic partnerships.
          </p>
        </div>
        
        <div className="relative">
          <div 
            ref={sliderRef}
            className="flex transition-transform duration-500 ease-in-out"
          >
            {displayTestimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className={`w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4`}
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 bg-white text-black rounded-full w-10 h-10 shadow-md hover:bg-gray-200 md:-translate-x-0 z-10"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white text-black rounded-full w-10 h-10 shadow-md hover:bg-gray-200 md:translate-x-0 z-10"
            onClick={nextSlide}
            disabled={currentSlide === maxSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Case Study Feature */}
        <div className="mt-24">
          <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="order-2 lg:order-1 p-8 lg:p-12 flex flex-col justify-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/10 text-white rounded-full">Case Study</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">40% Revenue Growth for GrowthTech</h3>
                <p className="text-gray-300 mb-6">
                  Learn how our AI-powered analytics solution helped GrowthTech identify market trends, optimize their product offering, and achieve remarkable growth in a competitive industry.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="link" 
                    className="inline-flex items-center justify-center font-medium text-white hover:text-gray-300 p-0"
                  >
                    Read the Case Study
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="order-1 lg:order-2 h-64 lg:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80" 
                  alt="Business growth results case study" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
