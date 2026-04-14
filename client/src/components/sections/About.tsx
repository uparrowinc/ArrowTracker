import { TeamMemberCard } from "@/components/ui/team-member-card";
import { TeamMember } from "@shared/schema";

interface AboutProps {
  teamMembers: TeamMember[];
}

export default function About({ teamMembers }: AboutProps) {
  // Stats to display
  const stats = [
    { value: "150+", label: "Projects Completed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "15+", label: "Years Experience" },
    { value: "100%", label: "Personalized Service" }
  ];

  // Single team member as a one-person operation
  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : [
    {
      id: 1,
      name: "Michael Foster",
      title: "Founder & Technology Consultant",
      bio: "15+ years in technology consulting, ecommerce solutions, and business strategy.",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
      linkedinUrl: "#",
      twitterUrl: "#"
    }
  ];

  return (
    <section className="pt-4 md:pt-20 pb-20 md:pb-32">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
              About
            </span>
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-[#163253] to-[#C8A466] mx-auto mb-8"></div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            I provide personalized technology consulting and implementation services to help businesses thrive in the digital age.
          </p>
        </div>
        
        {/* Mission & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center mb-32">
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">
                <span className="bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent">
                  My Mission
                </span>
              </h3>
              <div className="space-y-6 text-lg leading-relaxed">
                <p className="text-gray-300">
                  At up arrow inc, I'm dedicated to empowering businesses with technology solutions that drive sustainable growth and competitive advantage. I combine deep industry knowledge with technical expertise to deliver transformative outcomes for my clients.
                </p>
                <p className="text-gray-300">
                  My approach integrates strategic consulting with cutting-edge implementation, ensuring clients not only adopt the latest technologies but leverage them to their full potential. As a one-person operation, I provide direct, personalized service from initial consultation through implementation.
                </p>
              </div>
            </div>
            
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="card-glass rounded-xl p-6 text-center card-hover">
                  <p className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent mb-3">
                    {stat.value}
                  </p>
                  <p className="text-gray-300 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hero Image with Enhanced Effects */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#163253]/20 to-[#2C4A6E]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80" 
              alt="up arrow inc team" 
              className="relative z-10 rounded-2xl shadow-2xl w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl z-20"></div>
          </div>
        </div>
        
        {/* 
        COMMENTED OUT: Meet the Founder Section per user request
        
        {/* About Me Section with Enhanced Spacing */}
        {/*
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Meet the Founder
            </span>
          </h3>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-16"></div>
          
          <div className="flex justify-center">
            <div className="max-w-2xl">
              {displayTeamMembers.length > 0 && (
                <div className="card-glass rounded-2xl p-8 card-hover">
                  <TeamMemberCard member={displayTeamMembers[0]} />
                </div>
              )}
            </div>
          </div>
        </div>
        */}
      </div>
    </section>
  );
}
