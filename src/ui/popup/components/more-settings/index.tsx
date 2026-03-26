import {m} from 'malevic';

import type {ExtWrapper, Theme} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {isFirefox} from '../../../../utils/platform';
import {isURLInList} from '../../../../utils/url';
import {Button, Toggle} from '../../../controls';
import {SettingsIcon} from '../../../icons';
import {openExtensionPage} from '../../../utils';
import CustomSettingsToggle from '../custom-settings-toggle';
import EngineSwitch from '../engine-switch';
import FontSettings from '../font-settings';
import {getSiteToggleMessage, getAutomationMessage} from '../header';

async function openSettings() {
    await openExtensionPage('options');
}

interface MoreSettingsProps extends ExtWrapper {
    fonts: string[];
    onMoreSiteSettingsClick: () => void;
    onMoreToggleSettingsClick: () => void;
}

export default function MoreSettings({data, actions, fonts, onMoreSiteSettingsClick, onMoreToggleSettingsClick}: MoreSettingsProps) {
    const tab = data.activeTab;
    const custom = data.settings.customThemes.find(({url}) => isURLInList(tab.url, url));
    const theme = custom ? custom.theme : data.settings.theme;

    function setConfig(config: Partial<Theme>) {
        if (custom) {
            custom.theme = {...custom.theme, ...config};
            actions.changeSettings({customThemes: data.settings.customThemes});
        } else {
            actions.setTheme(config);
        }
    }

    const siteToggleMessage = getSiteToggleMessage({data, actions});
    const automationMessage = getAutomationMessage({data});

    return (
        <section class="more-settings">
            <div class="more-settings__section">
                <FontSettings config={theme} fonts={fonts} onChange={setConfig} />
            </div>
            <div class="more-settings__section">
                <EngineSwitch engine={theme.engine} onChange={(engine) => setConfig({engine})} />
            </div>
            <div class="more-settings__section more-settings__actions">
                <CustomSettingsToggle data={data} actions={actions} />
                <button
                    class="more-settings__quick-btn"
                    onclick={onMoreSiteSettingsClick}
                >
                    <SettingsIcon class="more-settings__quick-btn__icon" />
                    <span>{siteToggleMessage}</span>
                </button>
                <button
                    class="more-settings__quick-btn"
                    onclick={onMoreToggleSettingsClick}
                >
                    <SettingsIcon class="more-settings__quick-btn__icon" />
                    <span>{automationMessage}</span>
                </button>
                {isFirefox ? (
                    <Toggle
                        checked={data.settings.changeBrowserTheme}
                        labelOn={getLocalMessage('custom_browser_theme_on')}
                        labelOff={getLocalMessage('custom_browser_theme_off')}
                        onChange={(checked) => actions.changeSettings({changeBrowserTheme: checked})}
                    />
                ) : null}
                <Button onclick={openSettings} class="more-settings__settings-button">
                    <SettingsIcon class="more-settings__settings-button__icon" />
                    <span class="more-settings__settings-button__text">
                        {getLocalMessage('all_settings')}
                    </span>
                </Button>
            </div>
        </section>
    );
}
