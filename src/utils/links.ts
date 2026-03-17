export const HOMEPAGE_URL = 'https://github.com/AREKKUZZERA/darkplease';
export const BLOG_URL = `${HOMEPAGE_URL}/releases`;
export const NEWS_URL = '';
export const DEVTOOLS_DOCS_URL = `${HOMEPAGE_URL}/blob/main/CONTRIBUTING.md`;
export const GITHUB_URL = HOMEPAGE_URL;
export const PRIVACY_URL = `${HOMEPAGE_URL}/blob/main/SECURITY.md`;
export const TWITTER_URL = HOMEPAGE_URL;
export const UNINSTALL_URL = '';
export const CONFIG_URL_BASE = '';


export function getBlogPostURL(postId: string): string {
    return `${BLOG_URL}#${postId}`;
}
