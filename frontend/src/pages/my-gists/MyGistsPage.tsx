import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Plus, FileCode, Eye } from 'lucide-react';

import { useUserGists } from '@/lib/api/use-gist-queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function MyGistsPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const { data: gists, isLoading } = useUserGists(user?.id);

    if (!isLoaded || isLoading) {
        return (
            <div className="page-container">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <div className="grid gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="page-container">
                <div className="max-w-lg mx-auto card-sharp text-center py-12">
                    <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-xl font-bold mb-2">Sign in required</h1>
                    <p className="text-muted-foreground mb-6">
                        Please sign in to view your gists.
                    </p>
                    <Link to="/sign-in">
                        <Button className="btn-primary">Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="page-title mb-0">My Gists</h1>
                    <Link to="/create">
                        <Button className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Create
                        </Button>
                    </Link>
                </div>

                {!gists || gists.length === 0 ? (
                    <div className="card-sharp text-center py-12">
                        <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">No gists yet</p>
                        <Link to="/create">
                            <Button className="btn-primary">Create your first gist</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {gists.map((gist) => (
                            <div key={gist.snippetId} className="card-sharp">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-semibold text-lg truncate">{gist.title}</h2>
                                        <p className="text-sm text-muted-foreground truncate mt-1">
                                            {gist.description || 'No description'}
                                        </p>
                                    </div>
                                    <Badge variant={gist.isDraft ? 'secondary' : 'default'} className="ml-4">
                                        {gist.isDraft ? 'Draft' : 'Published'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(gist.createdAt).toLocaleDateString()}
                                    </span>
                                    <Link to={`/view/${gist.snippetId}`}>
                                        <Button variant="outline" size="sm" className="btn-outline">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
