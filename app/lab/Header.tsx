'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Menu } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import navigationItems from './configs'

interface SubNavigationItem {
  title: string
  href: string
  description?: string
}

interface NavigationItemWithLink {
  title: string
  href: string
}

interface NavigationItemWithSubItems {
  title: string
  items: SubNavigationItem[]
}

type NavigationItem = NavigationItemWithLink | NavigationItemWithSubItems

interface NavigationItemProps {
  item: NavigationItem
  pathname: string
}

const isNavigationItemWithSubItems = (item: NavigationItem): item is NavigationItemWithSubItems => {
  return 'items' in item
}

// 渲染单个导航项
const NavigationItem = ({ item, pathname }: NavigationItemProps) => {
  if (isNavigationItemWithSubItems(item)) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="text-base">{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {item.items.map(subItem => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={subItem.href}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none',
                      pathname === subItem.href && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <div className="text-base leading-none font-medium">{subItem.title}</div>
                    {subItem.description && (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-snug">
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
    )
  }

  return (
    <NavigationMenuItem key={item.title}>
      <Link href={item.href} legacyBehavior passHref>
        <NavigationMenuLink
          className={cn(
            'group bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-base font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
            pathname === item.href && 'bg-accent text-accent-foreground'
          )}
        >
          {item.title}
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  )
}

// 移动端导航项
const MobileNavigationItem = ({ item, pathname }: NavigationItemProps) => {
  if (isNavigationItemWithSubItems(item)) {
    return (
      <div key={item.title} className="space-y-4">
        <h4 className="text-base font-medium">{item.title}</h4>
        <div className="space-y-3 pl-4">
          {item.items.map(subItem => (
            <Link
              key={subItem.title}
              href={subItem.href}
              className={cn(
                'hover:text-foreground/80 block py-2 text-base transition-colors',
                pathname === subItem.href ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              <div>{subItem.title}</div>
              {subItem.description && (
                <p className="text-muted-foreground mt-1 text-sm">{subItem.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Link
      key={item.title}
      href={item.href}
      className={cn(
        'hover:text-foreground/80 block py-2 text-base font-medium transition-colors',
        pathname === item.href ? 'text-foreground' : 'text-foreground/60'
      )}
    >
      {item.title}
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center">
        <div className="mr-8 flex items-center">
          <Link href="/lab" className="flex items-center space-x-2">
            <span className="font-bold">实验室</span>
          </Link>
        </div>

        {/* 桌面导航 */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {navigationItems.map(item => (
                <NavigationItem key={item.title} item={item} pathname={pathname} />
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
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
                <nav className="mt-8 flex flex-col gap-4">
                  {navigationItems.map(item => (
                    <MobileNavigationItem key={item.title} item={item} pathname={pathname} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
