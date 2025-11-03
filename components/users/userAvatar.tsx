// components/UserAvatar.tsx
import Image from "next/image";

interface UserAvatarProps {
  avatar?: string;  // This could be URL or email prefix string
  email: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ avatar, email, size = 32, className = "" }: UserAvatarProps) {
  // Check if avatar is a URL (starts with http/https)
  if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return (
      <Image
        src={avatar}
        alt={`${email}'s avatar`}
        width={size} height= {size}
        className={`rounded-full border object-cover ${className}`}

      />
    );
  }

  // If it's not a URL, treat it as text for initials
  const getInitials = (text: string) => {
    // If it's an email, use the part before @
    const name = text.includes('@') ? text.split('@')[0] : text;
    
    return name
      .split(/[\s-]/) // Split by spaces or hyphens
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (text: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-800', 'bg-purple-700', 
      'bg-red-800', 'bg-yellow-700', 'bg-indigo-500',
      'bg-pink-500', 'bg-orange-500'
    ];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Use email as fallback if avatar is undefined or empty
  const displayText = avatar || email;

  return (
    <div 
      className={`${getBackgroundColor(displayText)} rounded-full border flex items-center justify-center text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(displayText)}
    </div>
  );
}