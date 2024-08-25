import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { ScrollArea } from "../components/ui/scroll-area";
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Gist {
  snippetId: string;
  title: string;
  description: string;
  content: string;
  isDraft: boolean;
  createdAt: string;
}

const MyGistsPage: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGists = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const response = await axios.get<Gist[]>(`${import.meta.env.VITE_SERVER_URI}/gist/user-gists?userId=${user.id}`);
          if (response) {
            setGists(response.data);
          } else {
            toast.error("Error", {
              description: "An error occurred while fetching gists",
              action: {
                label: "Dismiss",
                onClick: () => console.log("Undo"),
              },
            })
          }
        } catch (error) {
          console.error('Error fetching gists:', error);
          toast.error("Error", {
            description: "An error occurred while fetching gists",
            action: {
              label: "Dismiss",
              onClick: () => console.log("Undo"),
            },
          })
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGists();
  }, [isLoaded, isSignedIn, user, toast]);

  if (!isLoaded || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Gists</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="w-full">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-6">My Gists</h1>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xl">Please sign in to view your gists.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Gists</h1>
          <Link to="/create"><Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Gist
          </Button></Link>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gists.map((gist) => (
              <Card key={gist.snippetId} className="w-full">
                <CardHeader>
                  <CardTitle>{gist.title}</CardTitle>
                  <CardDescription>{gist.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(gist.createdAt).toLocaleDateString()}
                  </p>
                  <Badge variant={gist.isDraft ? "secondary" : "default"} className="mt-2">
                    {gist.isDraft ? "Draft" : "Published"}
                  </Badge>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/view/${gist.snippetId}`}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </a>
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/edit/${gist.snippetId}`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </a>
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
};

export default MyGistsPage;