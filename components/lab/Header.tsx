"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Menu } from "lucide-react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/helpers";
import navigationItems from "@/app/lab/configs";

interface SubNavigationItem {
  title: string;
  href: string;
  description?: string;
}

interface NavigationItemWithLink {
  title: string;
  href: string;
}

interface NavigationItemWithSubItems {
  title: string;
  items: SubNavigationItem[];
}

type NavigationItem = NavigationItemWithLink | NavigationItemWithSubItems;

interface NavigationItemProps {
  item: NavigationItem;
  pathname: string;
}

const isNavigationItemWithSubItems = (item: NavigationItem): item is NavigationItemWithSubItems => {
  return 'items' in item;
};

// 渲染单个导航项
const NavigationItem = ({ item, pathname }: NavigationItemProps) => {
  if (isNavigationItemWithSubItems(item)) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="text-base">{item.title}</NavigationMenuTrigger>
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
                    <div className="text-base font-medium leading-none">{subItem.title}</div>
                    {subItem.description && (
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2">
                        {subItem.description}
                      </p>
                    )}
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
            "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
            pathname === item.href && "bg-accent text-accent-foreground"
          )}
        >
          {item.title}
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  );
};

// 移动端导航项
const MobileNavigationItem = ({ item, pathname }: NavigationItemProps) => {
  if (isNavigationItemWithSubItems(item)) {
    return (
      <div key={item.title} className="space-y-4">
        <h4 className="text-base font-medium">{item.title}</h4>
        <div className="pl-4 space-y-3">
          {item.items.map((subItem) => (
            <Link
              key={subItem.title}
              href={subItem.href}
              className={cn(
                "block py-2 text-base transition-colors hover:text-foreground/80",
                pathname === subItem.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              <div>{subItem.title}</div>
              {subItem.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {subItem.description}
                </p>
              )}
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
        "block py-2 text-base font-medium transition-colors hover:text-foreground/80",
        pathname === item.href ? "text-foreground" : "text-foreground/60"
      )}
    >
      {item.title}
    </Link>
  );
};

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center mx-auto">
        <div className="flex items-center mr-8">
          <Link href="/lab" className="flex items-center space-x-2">
            <span className="font-bold">实验室</span>
          </Link>
        </div>

        {/* 桌面导航 */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {navigationItems.map((item) => (
                <NavigationItem key={item.title} item={item} pathname={pathname} />
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4 ml-auto">
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
                <SheetTitle className="sr-only">导航菜单</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8">
                  {navigationItems.map((item) => (
                    <MobileNavigationItem key={item.title} item={item} pathname={pathname} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}