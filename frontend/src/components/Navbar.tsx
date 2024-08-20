import React from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button
} from "@nextui-org/react";
import { Link } from "react-router-dom";
import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";

const NavbarComponent: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "Create Gist", href: "/create" },
    { name: "My Gists", href: "/my-gists" },
    { name: "FAQ", href: "/faq" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden bg-transparent focus:outline-0"
        />
        <NavbarBrand>
          <img src="/logo.png" alt="Gist Creator Logo" className='w-[40%]'/>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item, index) => (
          <NavbarItem key={`${item.name}-${index}`}>
            <Link to={item.href} className="text-foreground">
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Link to="/create">
            <Button color="primary" variant="bordered">
              Create Gist
            </Button>
          </Link>
        </NavbarItem>
        <NavbarItem>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link to="/sign-in">
              <Button color="primary" variant="flat">
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link
              to={item.href}
              className="w-full text-foreground"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}

export default NavbarComponent;