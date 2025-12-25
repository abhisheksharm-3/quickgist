import { HelpCircle } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
    {
        question: 'What is QuickGist?',
        answer: 'QuickGist is a platform for sharing code snippets and files instantly. No account required for basic sharing.',
    },
    {
        question: 'How do I create a gist?',
        answer: 'Click "Create" in the navigation, paste your code or upload a file, add a title, and hit Create. You\'ll get a shareable link instantly.',
    },
    {
        question: 'Do I need an account?',
        answer: 'No account is required for creating and sharing gists. However, signing in lets you manage your gists and track them in one place.',
    },
    {
        question: 'Are my gists private?',
        answer: 'Gists are accessible via their unique link. Anyone with the link can view them, but they\'re not publicly listed or searchable.',
    },
    {
        question: 'What file types are supported?',
        answer: 'You can share any text-based code or upload files up to 10MB. We support syntax highlighting for most programming languages.',
    },
    {
        question: 'Can I edit or delete my gists?',
        answer: 'Yes, if you\'re signed in. Go to "My Gists" to manage, edit, or delete your gists.',
    },
] as const;

export function FaqPage() {
    return (
        <div className="page-container">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 flex items-center justify-center border-2 border-primary text-primary">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="page-title mb-0">FAQ</h1>
                        <p className="text-muted-foreground">Common questions answered</p>
                    </div>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                    {FAQ_ITEMS.map((item, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="card-sharp border-2"
                        >
                            <AccordionTrigger className="px-4 py-3 text-left font-medium hover:no-underline">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
