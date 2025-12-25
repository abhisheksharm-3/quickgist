import { api } from './api-client';
import type { GistType, CreateGistParamsType } from '@/types/gist-types';

export async function fetchGist(id: string): Promise<GistType> {
    return api.get<GistType>(`/gist/view/${id}`);
}

export async function fetchUserGists(userId: string): Promise<GistType[]> {
    return api.get<GistType[]>('/gist/user-gists', { userId });
}

export async function createGist(params: CreateGistParamsType): Promise<GistType> {
    const formData = new FormData();
    formData.append('title', params.title);
    formData.append('description', params.description);
    formData.append('content', params.content);
    formData.append('isDraft', params.isDraft.toString());

    if (params.userId) {
        formData.append('userId', params.userId);
    }

    if (params.file) {
        formData.append('file', params.file);
    }

    return api.post<GistType>('/gist/create', formData);
}
