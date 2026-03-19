import {isNonPersistent} from '../utils/platform';

declare const __THUNDERBIRD__: boolean;

interface IconState {
    badgeText: string;
    active: boolean;
}

interface IconOptions {
    colorScheme?: 'dark' | 'light';
    isActive?: boolean;
    tabId?: number;
}

export default class IconManager {
    private static readonly iconState: IconState = {
        badgeText: '',
        active: true,
    };

    private static get actionApi() {
        return chrome.action;
    }

    private static getIconPaths(isActive: boolean): Record<number, string> {
        return isActive
            ? {
                  19: chrome.runtime.getURL('icons/dp_active_19.png'),
                  38: chrome.runtime.getURL('icons/dp_active_38.png'),
              }
            : {
                  19: chrome.runtime.getURL('icons/dp_active_light_19.png'),
                  38: chrome.runtime.getURL('icons/dp_active_light_38.png'),
              };
    }

    private static onStartup() {
        const action = IconManager.actionApi;
        if (!action) {
            return;
        }

        const path = IconManager.getIconPaths(IconManager.iconState.active);

        action.setIcon({path}, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to restore icon on startup:', chrome.runtime.lastError.message, path);
            }
        });

        action.setBadgeText({text: IconManager.iconState.badgeText}, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to restore badge text on startup:', chrome.runtime.lastError.message);
            }
        });

        if (IconManager.iconState.badgeText) {
            action.setBadgeBackgroundColor({color: '#e96c4c'}, () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to restore badge color on startup:', chrome.runtime.lastError.message);
                }
            });
        }
    }

    private static handleUpdate() {
        if (!isNonPersistent) {
            return;
        }

        chrome.runtime.onStartup.removeListener(IconManager.onStartup);

        if (IconManager.iconState.badgeText !== '' || !IconManager.iconState.active) {
            chrome.runtime.onStartup.addListener(IconManager.onStartup);
        }
    }

    static setIcon({isActive = this.iconState.active, tabId}: IconOptions): void {
        if (__THUNDERBIRD__) {
            return;
        }

        const action = this.actionApi;
        if (!action?.setIcon) {
            return;
        }

        this.iconState.active = isActive;

        const path = this.getIconPaths(isActive);

        action.setIcon(
            {
                path,
                ...(tabId !== undefined ? {tabId} : {}),
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to set icon:', chrome.runtime.lastError.message, path);
                }
            },
        );

        IconManager.handleUpdate();
    }

    static showBadge(text: string): void {
        if (__THUNDERBIRD__) {
            return;
        }

        const action = this.actionApi;
        if (!action?.setBadgeText || !action?.setBadgeBackgroundColor) {
            return;
        }

        IconManager.iconState.badgeText = text;

        action.setBadgeBackgroundColor({color: '#e96c4c'}, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to set badge background color:', chrome.runtime.lastError.message);
            }
        });

        action.setBadgeText({text}, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to set badge text:', chrome.runtime.lastError.message, text);
            }
        });

        IconManager.handleUpdate();
    }

    static hideBadge(): void {
        if (__THUNDERBIRD__) {
            return;
        }

        const action = this.actionApi;
        if (!action?.setBadgeText) {
            return;
        }

        IconManager.iconState.badgeText = '';

        action.setBadgeText({text: ''}, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to clear badge text:', chrome.runtime.lastError.message);
            }
        });

        IconManager.handleUpdate();
    }
}