import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Solutions() {
  const features = [
    {
      title: "Custom eCommerce Development",
      description: "Tailor-made online shopping solutions perfectly matched to your unique business requirements."
    },
    {
      title: "Technology Strategy & Planning",
      description: "Strategic guidance to help you make smart technology investments that align with your goals."
    },
    {
      title: "Automation & System Integration",
      description: "Connect your business systems for seamless data flow and improved operational efficiency."
    }
  ];

  return (
    <section className="py-8 md:py-12 bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">personalized technology solutions</h2>
            <p className="text-lg text-gray-300 mb-8">
              I provide customized technology solutions that help businesses of all sizes optimize operations, enhance customer experiences, and make smart technology investments.
            </p>
            

            
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 text-white mt-1">
                    <Check className="h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-white">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              asChild
              className="bg-white hover:bg-gray-200 text-black"
            >
              <a href="#contact">
                Discover AI Solutions
              </a>
            </Button>
          </div>
          
          {/* MASSIVE uAI Logo - Desktop IN YOUR FACE */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="rounded-2xl overflow-hidden bg-black/80 p-12 shadow-2xl border border-gray-700 w-full h-full flex items-center justify-center">
              <img 
                src="/attached_assets/image_1753753865238.png" 
                alt="uAI - AI Intelligence Hub" 
                className="w-[32rem] h-[32rem] object-contain opacity-95 hover:opacity-100 transition-all duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
