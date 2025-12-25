import { Github, Globe } from 'lucide-react';

const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com/abhisheksharm-3/quickgist', icon: Github },
    { label: 'Portfolio', href: 'https://abhisheksan.com', icon: Globe },
] as const;

export function PageFooter() {
    return (
        <footer className="border-t-2 border-border py-8 mt-auto">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} QuickGist
                </p>

                <div className="flex items-center gap-4">
                    {SOCIAL_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            aria-label={link.label}
                        >
                            <link.icon className="w-5 h-5" />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
