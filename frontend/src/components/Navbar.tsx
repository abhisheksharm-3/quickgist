import React from 'react';
import { Link } from "react-router-dom";
import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Menu, X } from "lucide-react";

const NavbarComponent = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "Create Gist", href: "/create" },
    { name: "My Gists", href: "/my-gists" },
    { name: "FAQ", href: "/faq" },
    { name: "Profile", href: "/profile" },
  ];

  React.useEffect(() => {
    // Prevent scrolling when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <nav className="relative z-50 bg-zinc-950 border-b-4 border-pink-500 p-4 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden bg-pink-500 hover:bg-pink-600 text-white p-2 
                     border-4 border-pink-400
                     shadow-[4px_4px_0px_0px_rgba(236,72,153,0.3)]
                     hover:translate-x-1 hover:translate-y-1
                     hover:shadow-[2px_2px_0px_0px_rgba(236,72,153,0.3)]
                     transition-all duration-200
                     relative z-50"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="transform -rotate-2">
            <div className="bg-zinc-950 border-4 border-blue-500 p-2
                          shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)]
                          hover:translate-x-1 hover:translate-y-1
                          hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]
                          transition-all duration-200">
              <span className="text-2xl font-black bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                QuickGist
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                to={item.href}
                className={`font-mono font-bold text-lg transform ${
                  index % 2 === 0 ? 'rotate-2' : '-rotate-2'
                } hover:text-pink-400 transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/create"
              className="hidden sm:block transform rotate-2"
            >
              <button className="bg-cyan-500 text-black font-bold px-4 py-2
                               border-4 border-cyan-400
                               shadow-[4px_4px_0px_0px_rgba(34,211,238,0.3)]
                               hover:translate-x-1 hover:translate-y-1
                               hover:shadow-[2px_2px_0px_0px_rgba(34,211,238,0.3)]
                               transition-all duration-200">
                Create Gist
              </button>
            </Link>
            
            <SignedIn>
              <div className="transform -rotate-2 bg-purple-500 border-4 border-purple-400 p-1
                            shadow-[4px_4px_0px_0px_rgba(168,85,247,0.3)]">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            
            <SignedOut>
              <Link to="/sign-in" className="transform -rotate-2">
                <button className="bg-green-500 text-black font-bold px-4 py-2
                                 border-4 border-green-400
                                 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.3)]
                                 hover:translate-x-1 hover:translate-y-1
                                 hover:shadow-[2px_2px_0px_0px_rgba(34,197,94,0.3)]
                                 transition-all duration-200">
                  Sign In
                </button>
              </Link>
            </SignedOut>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`sm:hidden fixed inset-0 bg-zinc-950 
                     transition-all duration-300 ease-in-out
                     ${isMenuOpen 
                       ? 'opacity-100 visible translate-y-0' 
                       : 'opacity-0 invisible -translate-y-full'}
                     z-40`}
        >
          <div className={`flex flex-col items-center justify-center h-full
                          transition-all duration-300 delay-150
                          ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
            {menuItems.map((item, index) => (
              <Link
                key={`${item.name}-${index}`}
                to={item.href}
                className="w-full text-center p-6 font-mono font-bold text-2xl
                         hover:bg-pink-500 hover:text-black
                         transition-colors
                         transform
                         transition-transform duration-300
                         hover:scale-105"
                style={{
                  transitionDelay: `${(index + 1) * 100}ms`
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavbarComponent;