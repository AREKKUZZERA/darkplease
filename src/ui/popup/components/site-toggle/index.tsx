import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {getURLHostOrProtocol, isURLEnabled, isPDF} from '../../../../utils/url';
import {Button} from '../../../controls';

import CheckmarkIcon from './checkmark-icon';

declare const __THUNDERBIRD__: boolean;
declare const __CHROMIUM_MV3__: boolean;

export function getSiteToggleData(props: ExtWrapper) {
    const {data, actions} = props;
    const tab = data.activeTab;

    function onSiteToggleClick() {
        if (pdf) {
            actions.changeSettings({enableForPDF: !data.settings.enableForPDF});
        } else {
            actions.toggleActiveTab();
        }
    }

    const pdf = isPDF(tab.url);
    const toggleHasEffect = (
        data.settings.enableForProtectedPages ||
        (!tab.isProtected && !pdf) ||
        tab.isInjected
    );
    const isSiteEnabled: boolean = isURLEnabled(tab.url, data.settings, tab, data.isAllowedFileSchemeAccess) && Boolean(tab.isInjected);
    const host = getURLHostOrProtocol(tab.url);
    const displayHost = host.startsWith('www.') ? host.substring(4) : host;

    const urlText = pdf ? 'PDF' : displayHost
        .split('.')
        .reduce<string[]>((elements, part, i) => elements.concat(
            i > 0 ? <wbr /> : null,
            `${i > 0 ? '.' : ''}${part}`
        ), []);

    function getDisabledReason(): string | null {
        if (!data.isEnabled) {
            return 'Extension is turned off';
        }
        const isFile = tab.url?.startsWith('file://');
        const isProtected = !isFile && ((!__CHROMIUM_MV3__ && !tab.isInjected) || tab.isProtected);
        if (isProtected) {
            return getLocalMessage('page_protected') || 'Protected page';
        }
        if (isFile && !data.isAllowedFileSchemeAccess) {
            return getLocalMessage('local_files_forbidden') || 'Local file access disabled';
        }
        if (tab.isInDarkList) {
            return getLocalMessage('page_in_dark_list') || 'Site is on the dark list';
        }
        if (tab.isDarkThemeDetected) {
            return getLocalMessage('dark_theme_detected') || 'Site has its own dark theme';
        }
        if (!data.settings.enabledByDefault && !isURLEnabled(tab.url, data.settings, tab, data.isAllowedFileSchemeAccess)) {
            return 'Not in the enabled list';
        }
        return null;
    }

    const disabledReason = isSiteEnabled ? null : getDisabledReason();

    return {urlText, onSiteToggleClick, toggleHasEffect, isSiteEnabled, disabledReason};
}

export default function SiteToggleButton(props: ExtWrapper) {
    const {urlText, onSiteToggleClick, toggleHasEffect, isSiteEnabled, disabledReason} = getSiteToggleData(props);

    return (
        <Button
            class={{
                'site-toggle': true,
                'site-toggle--active': isSiteEnabled,
                'site-toggle--disabled': __THUNDERBIRD__ || !toggleHasEffect,
            }}
            onclick={onSiteToggleClick}
            title={disabledReason ?? undefined}
        >
            <span class="site-toggle__main">
                <span class="site-toggle__mark"><CheckmarkIcon isChecked={isSiteEnabled} /></span>
                {' '}
                <span class="site-toggle__url">{urlText}</span>
            </span>
            {disabledReason ? (
                <span class="site-toggle__reason" title={disabledReason}>?</span>
            ) : null}
        </Button>
    );
}