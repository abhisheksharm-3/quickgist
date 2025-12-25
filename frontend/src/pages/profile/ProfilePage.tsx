import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Mail, Calendar, Code, BookOpen } from 'lucide-react';

import { useUserGists } from '@/lib/api/use-gist-queries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProfilePage() {
    const { userId, isLoaded: isAuthLoaded } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();
    const navigate = useNavigate();
    const { data: gists, isLoading } = useUserGists(user?.id);

    useEffect(() => {
        if (isAuthLoaded && !userId) {
            navigate('/sign-in');
        }
    }, [isAuthLoaded, userId, navigate]);

    if (!isAuthLoaded || !isUserLoaded || isLoading) {
        return (
            <div className="page-container">
                <div className="max-w-2xl mx-auto card-sharp">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        })
        : '';

    const sortedGists = gists?.slice().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="page-container">
            <div className="max-w-2xl mx-auto">
                <div className="card-sharp mb-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 border-2 border-primary">
                            <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {user.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <h1 className="text-xl font-bold">{user.fullName}</h1>
                            <Badge className="mt-1">@{user.username}</Badge>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {user.primaryEmailAddress?.emailAddress}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Joined {joinDate}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Code className="w-4 h-4" />
                                    {gists?.length ?? 0} gists
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="recent">
                    <TabsList className="w-full mb-4">
                        <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
                        <TabsTrigger value="all" className="flex-1">All Gists</TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent">
                        <GistList gists={sortedGists?.slice(0, 5) ?? []} />
                    </TabsContent>

                    <TabsContent value="all">
                        <GistList gists={sortedGists ?? []} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function GistList({ gists }: { gists: { snippetId: string; title: string; createdAt: string }[] }) {
    if (gists.length === 0) {
        return (
            <div className="card-sharp text-center py-8">
                <p className="text-muted-foreground">No gists yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {gists.map((gist) => (
                <div key={gist.snippetId} className="card-sharp">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">{gist.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {new Date(gist.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <Link to={`/view/${gist.snippetId}`}>
                            <Button variant="outline" size="sm" className="btn-outline">
                                <BookOpen className="w-4 h-4 mr-1" />
                                View
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
