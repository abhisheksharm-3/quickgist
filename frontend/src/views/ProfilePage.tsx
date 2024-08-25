import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { CalendarIcon, MailIcon, CodeIcon, BookOpenIcon } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";

interface Gist {
  snippetId: string;
  title: string;
  createdAt: string;
  language: string;
}

const ProfilePage: React.FC = () => {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loadingGists, setLoadingGists] = useState(true);

  useEffect(() => {
    if (isAuthLoaded && !userId) {
      navigate('/sign-in');
    }
  }, [isAuthLoaded, userId, navigate]);

  useEffect(() => {
    const fetchGists = async () => {
      if (isUserLoaded && user) {
        try {
          const response = await axios.get<Gist[]>(`${import.meta.env.VITE_SERVER_URI}/gist/user-gists?userId=${user.id}`);
          if (response.data) {
            setGists(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        } catch (error) {
          console.error('Error fetching gists:', error);
        } finally {
          setLoadingGists(false);
        }
      }
    };

    fetchGists();
  }, [isUserLoaded, user]);

  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-8 w-[250px] mt-4 mx-auto" />
          <Skeleton className="h-4 w-[200px] mt-2 mx-auto" />
          <Skeleton className="h-[400px] w-full mt-8 rounded-lg" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-32 h-32 border-4 border-primary">
                <AvatarImage src={user.imageUrl} alt="Profile" />
                <AvatarFallback className="text-4xl">{user.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">{user.fullName}</h1>
                <Badge variant="outline" className="mt-2">@{user.username}</Badge>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                  <div className="flex items-center">
                    <MailIcon className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm">{user.primaryEmailAddress?.emailAddress}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm">Joined {joinDate}</span>
                  </div>
                  <div className="flex items-center">
                    <CodeIcon className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm">{gists.length} Gists</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Gists</TabsTrigger>
            <TabsTrigger value="all">All Gists</TabsTrigger>
          </TabsList>
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Gists</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingGists ? (
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                ) : gists.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    {gists.slice(0, 5).map((gist) => (
                      <GistItem key={gist.snippetId} gist={gist} />
                    ))}
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No gists to show.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Gists</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingGists ? (
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                ) : gists.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    {gists.map((gist) => (
                      <GistItem key={gist.snippetId} gist={gist} />
                    ))}
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No gists to show.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const GistItem: React.FC<{ gist: Gist }> = ({ gist }) => (
  <div className="mb-4 p-4 border rounded-lg hover:bg-accent transition-colors duration-200">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold">
          <a href={`/view/${gist.snippetId}`} className="hover:underline text-primary">
            {gist.title}
          </a>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Created: {new Date(gist.createdAt).toLocaleDateString()}
        </p>
      </div>
      <Badge variant="secondary">{gist.language}</Badge>
    </div>
    <div className="mt-2 flex gap-2">
      <Button variant="outline" size="sm">
        <BookOpenIcon className="mr-2 h-4 w-4" />
        View
      </Button>
    </div>
  </div>
);

export default ProfilePage;