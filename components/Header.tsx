"use client";

import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navigationItems = [
  {
    title: "首页",
    href: "/",
  },
  {
    title: "关于",
    href: "/about",
  },
  {
    title: "博客",
    href: "/blog",
  },
  {
    title: "更多",
    items: [
      {
        title: "项目",
        href: "/projects",
        description: "查看我的项目列表",
      },
      {
        title: "联系我",
        href: "/contact",
        description: "获取联系方式",
      },
    ],
  },
];

export function Header() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Dogeow</span>
          </Link>
        </div>

        {/* 桌面导航 */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) => {
                if (item.items) {
                  return (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.items.map((subItem) => (
                            <li key={subItem.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    pathname === subItem.href && "bg-accent text-accent-foreground"
                                  )}
                                >
                                  <div className="text-sm font-medium leading-none">{subItem.title}</div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {subItem.description}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }

                return (
                  <NavigationMenuItem key={item.title}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                          pathname === item.href && "bg-accent text-accent-foreground"
                        )}
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <ModeToggle />
          
          {/* 移动端抽屉菜单 */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigationItems.map((item) => {
                    if (item.items) {
                      return (
                        <div key={item.title} className="space-y-3">
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="pl-4 space-y-2">
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.title}
                                href={subItem.href}
                                className={cn(
                                  "block py-2 text-sm transition-colors hover:text-foreground/80",
                                  pathname === subItem.href ? "text-foreground" : "text-foreground/60"
                                )}
                              >
                                {subItem.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          "block py-2 text-lg font-medium transition-colors hover:text-foreground/80",
                          pathname === item.href ? "text-foreground" : "text-foreground/60"
                        )}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 