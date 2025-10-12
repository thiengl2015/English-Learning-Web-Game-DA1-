import Image from 'next/image';
type LogoProps = {
  className?: string;
  size?: number;
};

export function Logo({ className, size = 100 }: LogoProps) {
  return (
    <Image
      src={"/logo.svg"} 
      alt="Techdies Robot Mascot"
      width={size} 
      height={size} 
      className={className} 
      priority={true} 
    />
  );
}