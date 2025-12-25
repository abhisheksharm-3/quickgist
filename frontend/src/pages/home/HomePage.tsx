import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Share2, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ColorBends from '@/components/ui/ColorBends';

export function HomePage() {
    return (
        <div>
            {/* Hero with ColorBends background - extends behind navbar */}
            <section className="relative min-h-[80vh] -mt-16 pt-16 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <ColorBends
                        className="w-full h-full"
                        colors={['#f59e0b', '#d97706', '#b45309']}
                        rotation={25}
                        speed={0.2}
                        scale={1.3}
                        frequency={1.2}
                        warpStrength={1.0}
                        mouseInfluence={0.5}
                        parallax={0.4}
                        noise={0.06}
                        transparent={false}
                    />
                </div>

                <div className="max-w-6xl mx-auto px-4 py-16 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                        Share anything,
                        <br />
                        <span className="text-primary">instantly.</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-lg mx-auto mb-10">
                        Paste text, code, or upload files. Get a shareable link in seconds. No sign up required.
                    </p>

                    <Link to="/create">
                        <Button className="btn-primary text-lg px-10 py-5">
                            Create Gist
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Steps */}
            <section className="border-t-2 border-b-2 border-border bg-card/50">
                <div className="max-w-6xl mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-3 gap-12 md:gap-8 text-center">
                        <StepItem number="1" title="Paste" desc="Add your content or upload a file" />
                        <StepItem number="2" title="Create" desc="Hit create, get your unique link" />
                        <StepItem number="3" title="Share" desc="Send the link to anyone" />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-4xl mx-auto px-4 py-20">
                <div className="grid sm:grid-cols-2 gap-4">
                    <Feature icon={Clock} title="Instant" desc="No sign up. Share in under 10 seconds." />
                    <Feature icon={Share2} title="Shareable" desc="Every gist gets a unique, permanent URL." />
                    <Feature icon={FileText} title="Files" desc="Attach documents, images, or any file." />
                    <Feature icon={Sparkles} title="Highlighting" desc="Code is beautifully formatted." />
                </div>
            </section>

            {/* CTA */}
            <section className="border-t-2 border-border">
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <p className="text-muted-foreground mb-4">Ready to share?</p>
                    <Link to="/create">
                        <Button className="btn-primary">
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}

function StepItem({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <div>
            <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center border-2 border-primary text-primary font-bold">
                {number}
            </div>
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof Clock; title: string; desc: string }) {
    return (
        <div className="p-5 border-2 border-border hover:border-primary/50 transition-colors">
            <Icon className="w-5 h-5 text-primary mb-3" />
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}
