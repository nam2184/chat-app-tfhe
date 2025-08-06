import { Badge } from "~/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import { Separator } from "~/components/ui/separator";
import React from "react";
import appStoreImage from "/home/appstore.png";
import playStoreImage from "/home/playstore.png";
import Logo from "./logos/Logo";

const navigationItems = [
  {
    group: [
      { label: "Overview", href: "#" },
      { label: "Solutions", href: "#", badge: "New" },
    ],
  },
  {
    group: [
      { label: "About us", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    group: [
      { label: "LinkedIn", href: "#" },
      { label: "Dribbble", href: "#" },
    ],
  },
  {
    group: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
];

const Footer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <footer
      className="flex flex-col w-full items-center gap-12 px-6 py-16 bg-primary"
    >
      <div
        className="flex flex-col w-full max-w-[1280px] items-start gap-12 px-6"
        ref={ref}
        {...props}
      >
        <div className="flex flex-wrap justify-between w-full gap-8 sm:flex-row flex-col">
          <NavigationMenu className="flex-1">
            <NavigationMenuList
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {navigationItems.map((section, index) => (
                <NavigationMenuItem key={index} className="flex flex-col gap-3">
                  {section.group.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <NavigationMenuLink
                        href={item.href}
                        className="text-[#f4d94a] font-semibold text-md
                          hover:text-[#f4d94a]/90"
                      >
                        {item.label}
                      </NavigationMenuLink>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="bg-success-200 text-success-700"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  ))}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex flex-col w-auto items-start gap-4">
            <h3 className="text-sm font-semibold text-[#f4d94a]">
              Get the app
            </h3>
            <div className="flex flex-col gap-4">
              <a href="#" className="w-[135px] h-auto">
                <img
                  src={appStoreImage}
                  alt="Download on the App Store"
                  className="w-full h-auto object-contain"
                />
              </a>
              <a href="#" className="w-[135px] h-auto">
                <img
                  src={playStoreImage}
                  alt="Get it on Google Play"
                  className="w-full h-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-[1280px] gap-6 px-6">
        <Separator className="bg-accent" />
        <div
          className="flex flex-wrap justify-between items-center w-full gap-4"
        >
          <div className="w-[120px] h-auto">
            <Logo className="w-full h-auto text-accent" />
          </div>
          <p className="text-md text-[#f4d94a]">
            © 2024 Demeterra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
