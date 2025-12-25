const API_BASE_URL = import.meta.env.VITE_SERVER_URI || 'http://localhost:8000';

type FetchOptionsType = RequestInit & {
    params?: Record<string, string>;
};

async function fetchApi<T>(endpoint: string, options: FetchOptionsType = {}): Promise<T> {
    const { params, ...init } = options;

    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
        ...init,
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
}

export const api = {
    get: <T>(endpoint: string, params?: Record<string, string>) =>
        fetchApi<T>(endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, body: FormData | Record<string, unknown>) => {
        const isFormData = body instanceof FormData;
        return fetchApi<T>(endpoint, {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body),
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        });
    },
};
