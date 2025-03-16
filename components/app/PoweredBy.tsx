import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import reactIcon from "../../public/images/tech/react.svg";
import laravelIcon from "../../public/images/tech/laravel.svg";
import NextJsIcon from "../../public/images/tech/next-js.svg";
import graphQlIcon from "../../public/images/tech/shadcn.svg";

interface TechLinkProps {
  href: string;
  src: string;
  alt: string;
}

const TechLink: React.FC<TechLinkProps> = ({ href, src, alt }) => (
  <Link 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="inline-flex items-center"
  >
    <Image 
      src={src} 
      alt={alt} 
      width={20} 
      height={20} 
      className="transition-transform hover:scale-110" 
    />
  </Link>
);

const PoweredBy: React.FC = () => (
  <div className="flex items-center gap-2">
    <span>Powered By 🫴</span>
    <TechLink href="https://nextjs.org" src={NextJsIcon} alt="Next.js" />
    <TechLink href="https://laravel.com" src={laravelIcon} alt="Laravel" />
    <TechLink href="https://ui.shadcn.com" src={graphQlIcon} alt="shadcn/ui" />
    <TechLink href="https://react.dev" src={reactIcon} alt="React" />
  </div>
);

export default PoweredBy;
