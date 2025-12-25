import { useParams, Link } from 'react-router-dom';
import { Copy, Download, ArrowLeft, FileCode, File, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useGist } from '@/lib/api/use-gist-queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = import.meta.env.VITE_SERVER_URI || 'http://localhost:8000';

function getFullFileUrl(fileUrl: string): string {
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${API_BASE_URL}${fileUrl}`;
}

function isPreviewableFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    const previewable = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'txt', 'md', 'json'];
    return previewable.includes(ext);
}

export function ViewGistPage() {
    const { id } = useParams<{ id: string }>();
    const { data: gist, isLoading, error } = useGist(id || '');

    if (isLoading) {
        return (
            <div className="page-container">
                <div className="max-w-4xl mx-auto space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (error || !gist) {
        return (
            <div className="page-container">
                <div className="max-w-lg mx-auto card-sharp text-center py-12">
                    <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-xl font-bold mb-2">Gist Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        This gist doesn't exist or has been deleted.
                    </p>
                    <Link to="/">
                        <Button className="btn-primary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleCopyContent = () => {
        navigator.clipboard.writeText(gist.content);
        toast.success('Content copied!');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
    };

    const fullFileUrl = gist.fileURL ? getFullFileUrl(gist.fileURL) : null;
    const canPreview = gist.fileName ? isPreviewableFile(gist.fileName) : false;

    return (
        <div className="page-container">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{gist.title}</h1>
                        {gist.description && (
                            <p className="text-muted-foreground mt-1">{gist.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                            {new Date(gist.createdAt).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopyContent} className="btn-outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopyLink} className="btn-outline">
                            Share
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {gist.content && (
                    <div className="border-2 border-border overflow-hidden mb-6">
                        <SyntaxHighlighter
                            language="javascript"
                            style={oneDark}
                            customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                background: 'hsl(0 0% 4%)',
                                fontSize: '14px',
                            }}
                            showLineNumbers
                        >
                            {gist.content}
                        </SyntaxHighlighter>
                    </div>
                )}

                {/* Attached File */}
                {fullFileUrl && (
                    <div className="card-sharp">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-medium">{gist.fileName || 'Attached file'}</p>
                                    <p className="text-sm text-muted-foreground">File attachment</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {canPreview && (
                                    <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="btn-outline">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </a>
                                )}
                                <a href={fullFileUrl} download={gist.fileName}>
                                    <Button variant="outline" size="sm" className="btn-outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

