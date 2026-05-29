import Image from "next/image";

type SessionAvatarProps = {
  src: string;
  alt: string;
};

export default function SessionAvatar({ src, alt }: SessionAvatarProps) {
  return (
    <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
