import { cn } from "../lib/utils";
import { ReactNode } from "react";
import Footer from "./Footer";
import NavbarComponent from "./Navbar";

const Layout = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "w-screen min-h-screen flex flex-col justify-between bg-black font-poppins",
        className
      )}
    >
      {/* TODO: use context to avoid prop drilling */}
      <NavbarComponent />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;