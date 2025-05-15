import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import reactIcon from "@/public/images/tech/react.svg";
import laravelIcon from "@/public/images/tech/laravel.svg";
import NextJsIcon from "@/public/images/tech/next-js.svg";
import graphQlIcon from "@/public/images/tech/shadcn.svg";

interface TechLinkProps {
  href: string;
  src: string;
  alt: string;
  needsInvert?: boolean;
}

const TechLink: React.FC<TechLinkProps> = ({ href, src, alt, needsInvert }) => (
  <Link 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center text-sm"
  >
    <Image 
      src={src} 
      alt={alt} 
      width={20} 
      height={20} 
      className={`transition-transform hover:scale-110 ${needsInvert ? 'dark:invert' : ''}`} 
    />
  </Link>
);

const PoweredBy: React.FC = () => (
  <div className="flex items-center gap-2 text-sm opacity-80">
    <span>Powered By 🫴</span>
    <TechLink href="https://nextjs.org" src={NextJsIcon} alt="Next.js" needsInvert={true} />
    <TechLink href="https://laravel.com" src={laravelIcon} alt="Laravel" needsInvert={false} />
    <TechLink href="https://ui.shadcn.com" src={graphQlIcon} alt="shadcn/ui" needsInvert={true} />
    <TechLink href="https://react.dev" src={reactIcon} alt="React" needsInvert={false} />
  </div>
);

export default PoweredBy;
