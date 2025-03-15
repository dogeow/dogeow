import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import BuiltBy from "./BuiltBy";
import PowerBy from "./PoweredBy";

const BEIAN_URL = "http://www.beian.gov.cn/";
const MIIT_URL = "https://beian.miit.gov.cn/";

// 假设ICP图标已经移动到public/images目录
const ICP_ICON_PATH = "/images/icp.png";

const ExternalLink = ({ 
  href, 
  children, 
  className 
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <Link 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className={cn("hover:underline", className)}
  >
    {children}
  </Link>
);

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2 opacity-80">
        <div>
          <PowerBy />
        </div>
        <div>
          <BuiltBy />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 opacity-60">
        <div>
          <ExternalLink href={BEIAN_URL}>
            <span className="flex items-center">
              <Image 
                src={ICP_ICON_PATH} 
                alt="ICP 图标" 
                width={20} 
                height={20} 
                className="inline-block align-middle mr-1" 
              />
              闽公网安备35020302033650号
            </span>
          </ExternalLink>
        </div>
        <div>
          <ExternalLink href={MIIT_URL}>闽ICP备19021694号</ExternalLink>
        </div>
      </div>
    </footer>
  );
}
