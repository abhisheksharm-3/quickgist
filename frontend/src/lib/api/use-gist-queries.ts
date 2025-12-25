import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGist, fetchUserGists, createGist } from './gist-api';
import type { CreateGistParamsType } from '@/types/gist-types';

export function useGist(id: string) {
    return useQuery({
        queryKey: ['gist', id],
        queryFn: () => fetchGist(id),
        enabled: Boolean(id),
    });
}

export function useUserGists(userId: string | undefined) {
    return useQuery({
        queryKey: ['userGists', userId],
        queryFn: () => fetchUserGists(userId!),
        enabled: Boolean(userId),
    });
}

export function useCreateGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateGistParamsType) => createGist(params),
        onSuccess: (_, variables) => {
            if (variables.userId) {
                queryClient.invalidateQueries({ queryKey: ['userGists', variables.userId] });
            }
        },
    });
}
