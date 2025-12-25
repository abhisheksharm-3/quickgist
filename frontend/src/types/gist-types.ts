export type GistType = {
    snippetId: string;
    title: string;
    description: string;
    content: string;
    isDraft: boolean;
    createdAt: string;
    userId?: string;
    fileName?: string;
    fileURL?: string;
};

export type CreateGistParamsType = {
    title: string;
    description: string;
    content: string;
    isDraft: boolean;
    userId?: string;
    file?: File;
};
