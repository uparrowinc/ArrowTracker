import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-content text-center">
        {/* Background Elements - Executive Navy */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#163253]/15 via-[#2C4A6E]/10 to-[#163253]/15 rounded-3xl blur-3xl"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
                Ready to Transform Your Business?
              </span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-[#163253] to-[#C8A466] mx-auto mb-8"></div>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Schedule a personal consultation to discuss your specific technology challenges and opportunities.
            </p>
          </div>
          
          <div className="space-y-6">
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] text-white px-12 py-6 text-xl font-medium border border-[#C8A466]/30 shadow-2xl shadow-[#163253]/40 transition-all duration-300 hover:scale-105 rounded-full"
            >
              <a href="#contact">
                Get Started Today
              </a>
            </Button>
            
            <p className="text-gray-400 text-lg">
              Free initial consultation • Custom solutions • Measurable results
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
