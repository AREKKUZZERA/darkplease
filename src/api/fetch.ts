const throwCORSError = async (url: string) => {
    return Promise.reject(new Error(
        [
            'Embedded DARK PLEASE! cannot access a cross-origin resource',
            url,
            'Overview your URLs and CORS policies or use',
            '`DarkPlease.setFetchMethod(fetch: (url) => Promise<Response>))`.',
            'See if using `DarkPlease.setFetchMethod(window.fetch)`',
            'before `DarkPlease.enable()` works.',
        ].join(' '),
    ));
};

type Fetcher = (url: string) => Promise<Response>;

let fetcher: Fetcher = throwCORSError;

export function setFetchMethod(fetch: Fetcher): void {
    if (fetch) {
        fetcher = fetch;
    } else {
        fetcher = throwCORSError;
    }
}

export async function callFetchMethod(url: string): Promise<Response> {
    return await fetcher(url);
}
