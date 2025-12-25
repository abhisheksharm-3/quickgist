import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Menu, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'My Gists', href: '/my-gists' },
    { label: 'FAQ', href: '/faq' },
] as const;

export function PageHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    return (
        <>
            <header className="border-b border-border/50 bg-background/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="font-bold text-xl text-primary">
                        QuickGist
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    'text-sm font-medium transition-colors hover:text-primary',
                                    location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link to="/create">
                            <Button className="btn-primary hidden sm:flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Create
                            </Button>
                        </Link>

                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>

                        <SignedOut>
                            <Link to="/sign-in">
                                <Button variant="outline" className="btn-outline">
                                    Sign In
                                </Button>
                            </Link>
                        </SignedOut>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Fullscreen Mobile Menu with scroll lock */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/80 backdrop-blur-xl overflow-hidden">
                    <nav className="flex flex-col items-center justify-center h-full gap-8">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    'text-2xl font-semibold transition-colors hover:text-primary',
                                    location.pathname === link.href ? 'text-primary' : 'text-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <Link to="/create" onClick={() => setIsMenuOpen(false)}>
                            <Button className="btn-primary text-lg px-8 py-4 mt-4">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Gist
                            </Button>
                        </Link>
                    </nav>
                </div>
            )}
        </>
    );
}
