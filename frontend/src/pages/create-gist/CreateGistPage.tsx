import { useState, useTransition, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Upload, X, Copy, ExternalLink, File } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { useCreateGist } from '@/lib/api/use-gist-queries';
import {
    createGistSchema,
    TITLE_MAX_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    type CreateGistFormDataType,
} from './create-gist-schema';
import type { GistType } from '@/types/gist-types';

export function CreateGistPage() {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const createGist = useCreateGist();

    const [isPending, startTransition] = useTransition();
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [createdGist, setCreatedGist] = useState<GistType | null>(null);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const form = useForm<CreateGistFormDataType>({
        resolver: zodResolver(createGistSchema),
        defaultValues: {
            title: '',
            description: '',
            content: '',
        },
    });

    const titleValue = form.watch('title');
    const descriptionValue = form.watch('description');

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    }, []);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleSubmit = (data: CreateGistFormDataType) => {
        startTransition(async () => {
            try {
                const gist = await createGist.mutateAsync({
                    title: data.title,
                    description: data.description || '',
                    content: data.content,
                    isDraft: false,
                    userId: isAnonymous ? undefined : user?.id,
                    file: file || undefined,
                });

                setCreatedGist(gist);
                setIsSuccessOpen(true);
                form.reset();
                setFile(null);
            } catch {
                toast.error('Failed to create gist');
            }
        });
    };

    const gistUrl = createdGist ? `${window.location.origin}/view/${createdGist.snippetId}` : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(gistUrl);
        toast.success('Link copied!');
    };

    return (
        <div className="page-container">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">New Gist</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Title</FormLabel>
                                            <span className="text-xs text-muted-foreground">
                                                {titleValue?.length || 0}/{TITLE_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="My snippet"
                                                className="input-sharp"
                                                maxLength={TITLE_MAX_LENGTH}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Description</FormLabel>
                                            <span className="text-xs text-muted-foreground">
                                                {descriptionValue?.length || 0}/{DESCRIPTION_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Optional"
                                                className="input-sharp"
                                                maxLength={DESCRIPTION_MAX_LENGTH}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Paste your content here..."
                                            className="input-sharp min-h-[300px] font-mono text-sm"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div
                            onDrop={handleFileDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="border-2 border-dashed border-border p-4 hover:border-primary/50 transition-colors"
                        >
                            {file ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <File className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="p-1 hover:text-primary"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 cursor-pointer py-2">
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        Drop a file or click to browse
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-3">
                                {isSignedIn && (
                                    <>
                                        <Switch
                                            id="anonymous"
                                            checked={isAnonymous}
                                            onCheckedChange={setIsAnonymous}
                                        />
                                        <label htmlFor="anonymous" className="text-sm cursor-pointer">
                                            Post anonymously
                                        </label>
                                    </>
                                )}
                                {!isSignedIn && (
                                    <span className="text-sm text-muted-foreground">
                                        Posting anonymously
                                    </span>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="btn-primary"
                            >
                                {isPending ? 'Creating...' : 'Create Gist'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="card-sharp max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Gist Created!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            "{createdGist?.title}" is ready to share.
                        </p>
                        <div className="p-3 bg-background border-2 border-border font-mono text-sm break-all">
                            {gistUrl}
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleCopyLink} className="btn-primary flex-1">
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                            </Button>
                            <Button
                                onClick={() => navigate(`/view/${createdGist?.snippetId}`)}
                                variant="outline"
                                className="btn-outline flex-1"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
