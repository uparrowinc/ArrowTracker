import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { TeamMember } from "@shared/schema";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="text-center">
      <div className="mb-4 mx-auto w-40 h-40 rounded-full overflow-hidden">
        <img 
          src={member.imageUrl} 
          alt={member.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="text-xl font-semibold text-white">{member.name}</h4>
      <p className="text-white mb-2">{member.title}</p>
      <p className="text-gray-300 text-sm mb-3">{member.bio}</p>
      <div className="flex justify-center space-x-3">
        {member.linkedinUrl && (
          <a href={member.linkedinUrl} className="text-white hover:text-gray-300">
            <FaLinkedinIn className="h-5 w-5" />
          </a>
        )}
        {member.twitterUrl && (
          <a href={member.twitterUrl} className="text-white hover:text-gray-300">
            <FaXTwitter className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
