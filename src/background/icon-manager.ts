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
    private static readonly ICON_PATHS = {
        activeDark: {
            19: '../icons/dp_active_19.png',
            38: '../icons/dp_active_38.png',
        },
        activeLight: {
            19: '../icons/dp_active_light_19.png',
            38: '../icons/dp_active_light_38.png',
        },
        // Inactive state: swap the schemes so the icon looks visually "off"
        inactiveDark: {
            19: '../icons/dp_active_light_19.png',
            38: '../icons/dp_active_light_38.png',
        },
        inactiveLight: {
            19: '../icons/dp_active_19.png',
            38: '../icons/dp_active_38.png',
        },
    };

    private static readonly iconState: IconState = {
        badgeText: '',
        active: true,
    };

    private static onStartup() {

    }

    private static handleUpdate() {
        if (!isNonPersistent) {
            return;
        }
        if (IconManager.iconState.badgeText !== '' || !IconManager.iconState.active) {
            chrome.runtime.onStartup.addListener(IconManager.onStartup);
        } else {
            chrome.runtime.onStartup.removeListener(IconManager.onStartup);
        }
    }

    static setIcon({isActive = this.iconState.active, colorScheme = 'dark', tabId}: IconOptions): void {
        if (__THUNDERBIRD__ || !chrome.browserAction.setIcon) {
            return;
        }

        if (tabId) {
            return;
        }

        this.iconState.active = isActive;

        let path;
        if (isActive) {
            path = colorScheme === 'light'
                ? IconManager.ICON_PATHS.activeLight
                : IconManager.ICON_PATHS.activeDark;
        } else {
            path = colorScheme === 'light'
                ? IconManager.ICON_PATHS.inactiveLight
                : IconManager.ICON_PATHS.inactiveDark;
        }

        chrome.browserAction.setIcon({path});
        IconManager.handleUpdate();
    }

    static showBadge(text: string): void {
        IconManager.iconState.badgeText = text;
        chrome.browserAction.setBadgeBackgroundColor({color: '#e96c4c'});
        chrome.browserAction.setBadgeText({text});
        IconManager.handleUpdate();
    }

    static hideBadge(): void {
        IconManager.iconState.badgeText = '';
        chrome.browserAction.setBadgeText({text: ''});
        IconManager.handleUpdate();
    }
}
