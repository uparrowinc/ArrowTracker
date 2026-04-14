import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone } from "lucide-react";
import { FaLinkedinIn, FaXTwitter, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { z } from "zod";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      serviceInterest: "",
      message: ""
    }
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/contact', data);
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
        variant: "default",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-4 md:pt-20 pb-20 md:pb-32">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
              Get In Touch
            </span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-[#163253] to-[#C8A466] mx-auto mb-8"></div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Ready to elevate your business with cutting-edge technology solutions? Let's start the conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
          <div className="space-y-12">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
                  Let's Connect
                </span>
              </h3>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Have questions about our services or ready to start a project? Get in touch with our team and let's discuss how we can help your business grow.
              </p>
            </div>
              
            <div className="space-y-8">
              <div className="card-glass rounded-xl p-6 card-hover">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-white mb-2">Our Location</h4>
                    <p className="text-gray-300">123 Innovation Drive, Suite 400<br/>San Francisco, CA 94103</p>
                  </div>
                </div>
              </div>
              
              <div className="card-glass rounded-xl p-6 card-hover">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-white mb-2">Email Us</h4>
                    <p className="text-gray-300">info@uparrowinc.com<br/>support@uparrowinc.com</p>
                  </div>
                </div>
              </div>
              
              <div className="card-glass rounded-xl p-6 card-hover">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-white mb-2">Call Us</h4>
                    <p className="text-gray-300">(415) 555-0123<br/>Mon-Fri, 9am-6pm PST</p>
                  </div>
                </div>
              </div>
            </div>
              
            <div className="flex space-x-6 justify-center lg:justify-start">
              <a 
                href="https://linkedin.com/company/uparrowinc" 
                className="h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedinIn className="h-6 w-6" />
              </a>
              <a 
                href="https://twitter.com/uparrowinc" 
                className="h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaXTwitter className="h-6 w-6" />
              </a>
              <a 
                href="https://facebook.com/uparrowinc" 
                className="h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF className="h-6 w-6" />
              </a>
              <a 
                href="https://instagram.com/uparrowinc" 
                className="h-12 w-12 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="h-6 w-6" />
              </a>
            </div>
          </div>
            
          {/* Contact Form */}
          <div className="card-glass rounded-2xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
                Send us a message
              </span>
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serviceInterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service of Interest</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="business-consulting">Business Strategy Consulting</SelectItem>
                              <SelectItem value="ai-implementation">AI Implementation</SelectItem>
                              <SelectItem value="commerce-solutions">Commerce Solutions</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your project or questions..." 
                              rows={4} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] text-white py-4 text-lg font-medium border border-[#C8A466]/30 shadow-lg shadow-[#163253]/40 transition-all duration-300 hover:scale-105 rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
