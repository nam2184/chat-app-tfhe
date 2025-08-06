import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { cn } from "~/lib/utils";
import { Link } from "react-router";
import Logo from "../logos/Logo";
import { useAuthenticator } from "@aws-amplify/ui-react";

const routes: {
  title: string;
  to: string;
}[] = [
  {
    title: "Organisation",
    to: "/dashboard/organisation",
  },
  {
    title: "Projects",
    to: "/dashboard/projects",
  },
];

const Navbar = React.forwardRef<
  HTMLDivElement,
  React.ButtonHTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const { signOut } = useAuthenticator();

  const onLogOut = signOut;

  return (
    <div
      className={cn(
        "flex h-20 flex-row justify-between bg-primary p-5",
        className,
      )}
      ref={ref}
      {...props}
    >
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button>
            <Menu className="h-8 w-8 text-accent" />
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
        <div className="bg-primary px-0.5">
          <Logo className="h-8 text-accent" />
        </div>
      </Link>
      <Button onClick={onLogOut}>Log out</Button>
    </div>
  );
});
Navbar.displayName = "Navbar";

export default Navbar;
