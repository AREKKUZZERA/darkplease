export const HOMEPAGE_URL = 'https://github.com/AREKKUZZERA/darkplease';
export const BLOG_URL = `${HOMEPAGE_URL}/releases`;
export const DEVTOOLS_DOCS_URL = `${HOMEPAGE_URL}#readme`;
export const GITHUB_URL = HOMEPAGE_URL;
export const PRIVACY_URL = `${HOMEPAGE_URL}/blob/main/LICENSE`;
export const TWITTER_URL = HOMEPAGE_URL;

export function getBlogPostURL(postId: string): string {
    return `${BLOG_URL}#${postId}`;
}