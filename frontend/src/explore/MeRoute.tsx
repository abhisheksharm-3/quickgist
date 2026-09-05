/** Your own gists, including unlisted and private ones, at `/me`. */
import { Link, useNavigate } from 'react-router';
import { useSession } from '@/auth/use-session';
import { EmptyState } from '@/chrome/EmptyState';
import { ListSkeleton } from '@/chrome/ListSkeleton';
import { PageHeader } from '@/chrome/PageHeader';
import { RouteError } from '@/chrome/RouteError';
import { CommandPalette } from '@/command/CommandPalette';
import { GistList } from '@/explore/GistList';
import { MeStats } from '@/explore/MeStats';
import type { OwnGistsPropsType } from '@/explore/types';
import { useGistList } from '@/lib/use-gist-queries';
import { useMyProfile } from '@/lib/use-my-profile';

/**
 * Your gists.
 *
 * The handle comes from the API rather than being guessed in the browser, because a
 * wrong handle here does not fail loudly: it lists the public feed instead, which
 * looks like your gists until you notice they are not.
 */
export function MeRoute() {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();
  const profile = useMyProfile();

  return (
    <>
      <title>Your gists · quickgist</title>
      <meta name="robots" content="noindex" />

      {isLoading || user ? (
        <PageHeader
          eyebrow="Account"
          title="Your gists"
          description="Everything you have published, including the unlisted and private ones nobody else can see."
          aside={
            profile.data ? (
              <p className="font-mono text-[11px] text-[var(--faint)]">
                Public page{' '}
                <Link
                  to={`/u/${profile.data.handle}`}
                  className="text-[var(--dim)] underline underline-offset-[3px] hover:text-[var(--heading)]"
                >
                  /u/{profile.data.handle}
                </Link>
              </p>
            ) : null
          }
        />
      ) : null}

      {isLoading ? <ListSkeleton rows={4} /> : null}

      {!isLoading && !user ? (
        <EmptyState
          code="Signed out"
          title="Sign in to see your gists"
          actions={[
            { label: 'Sign in', to: '/sign-in', primary: true },
            { label: 'Create an account', to: '/sign-up' },
          ]}
        >
          Everything you make while signed in appears here, including unlisted and private gists
          nobody else can see.
        </EmptyState>
      ) : null}

      {user && profile.isPending ? <ListSkeleton rows={4} /> : null}
      {user && profile.isError ? <RouteError error={profile.error} /> : null}
      {user && profile.data ? <OwnGists handle={profile.data.handle} /> : null}

      <CommandPalette onNew={() => navigate('/')} />
    </>
  );
}

function OwnGists({ handle }: OwnGistsPropsType) {
  const gists = useGistList({ author: handle, limit: 100 });

  if (gists.isPending) {
    return <ListSkeleton rows={4} />;
  }
  if (gists.isError) {
    return <RouteError error={gists.error} />;
  }

  return (
    <>
      <MeStats gists={gists.data} />
      <GistList
        gists={gists.data}
        empty={
          <EmptyState
            code="Empty"
            title="You have not made one yet"
            actions={[{ label: 'Start a gist', to: '/', primary: true }]}
          >
            Anything you create while signed in shows up here, including unlisted and private gists
            that nobody else can see.
          </EmptyState>
        }
      />
    </>
  );
}
