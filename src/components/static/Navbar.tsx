import { Button } from "~/components/ui/button";
import React from "react";
import { Link } from "react-router";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Logo from "../logos/Logo";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import * as utils from "~/lib/utils";

let routes: {
  title: string;
  to: string;
  active: boolean;
}[] = [
  {
    title: "Home",
    to: "/",
    active: true,
  },
  {
    title: "My Organisation",
    to: "dashboard/organisation",
    active: false,
  },
  {
    title: "Projects",
    to: "dashboard/projects",
    active: false,
  },
  {
    title: "Metrics",
    to: "/metrics",
    active: false,
  },
];

if (utils.isStaticExport) {
  routes = [routes[0]];
} 

const StaticNavbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const { authStatus } = useAuthenticator();

  return (
    <div
      className={cn(
        "relative w-full h-20 px-10 py-5 bg-background flex items-center",
        className,
      )}
      {...props}
      ref={ref}
    >
      <div className="hidden md:flex w-full justify-center gap-5">
        <div className="absolute left-10 inset-y-0 flex items-center">
          <Link to="/">
            <Logo className="h-8 text-accent" />
          </Link>
        </div>
        {routes.map((route, i) => (
          <Link
            className={cn(
              "text-primary/50 text-base",
              route.active && "font-medium text-primary",
            )}
            to={route.to}
            key={i}
          >
            {route.title}
          </Link>
        ))}
        <div className="absolute right-10 inset-y-0 flex items-center">
          {authStatus === "authenticated" ? (
            <Button disabled={utils.isStaticExport} asChild>
              <Link to="/dashboard/organisation">Dashboard</Link>
            </Button>
          ) : (
            <Button disabled={utils.isStaticExport} asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="flex w-full items-center justify-center md:hidden">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="absolute left-10 flex items-center">
              <Menu className="h-8 w-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="space-y-3 rounded-none bg-primary p-3 border-none"
            align="start"
            alignOffset={-20}
            side="bottom"
            sideOffset={20}
          >
            {routes.map((route, i) => (
              <DropdownMenuItem
                key={i}
                className="text-accent hover:text-accent-foreground"
              >
                <Link onClick={() => setDropdownOpen(false)} to={route.to}>{route.title}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-8" />
        </Link>
        <div className="absolute right-10 flex items-center">
          {authStatus === "authenticated" ? (
            <Button asChild>
              <Link to="/dashboard/organisation">Dashboard</Link>
            </Button>
          ) : (
            <Button disabled={utils.isStaticExport} asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

StaticNavbar.displayName = "StaticNavbar";

export default StaticNavbar;
