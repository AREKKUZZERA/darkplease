import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {getURLHostOrProtocol, isURLInList} from '../../../../utils/url';
import {Button} from '../../../controls';
import CheckmarkIcon from '../site-toggle/checkmark-icon';

declare const __THUNDERBIRD__: boolean;

export default function CustomSettingsToggle({data, actions}: ExtWrapper) {
    const tab = data.activeTab;
    const host = getURLHostOrProtocol(tab.url);

    const isCustom = data.settings.customThemes.some(({url}) => isURLInList(tab.url, url));

    const urlText = host
        .split('.')
        .reduce<string[]>((elements, part, i) => elements.concat(
            <wbr />,
            `${i > 0 ? '.' : ''}${part}`
        ), []);

    return (
        <Button
            class={{
                'custom-settings-toggle': true,
                'custom-settings-toggle--checked': isCustom,
                'custom-settings-toggle--disabled': __THUNDERBIRD__ || tab.isProtected,
            }}
            onclick={() => {
                if (isCustom) {
                    const filtered = data.settings.customThemes.filter(({url}) => !isURLInList(tab.url, url));
                    actions.changeSettings({customThemes: filtered});
                } else {
                    const extended = data.settings.customThemes.concat({
                        url: [host],
                        theme: {...data.settings.theme},
                    });
                    actions.changeSettings({customThemes: extended});
                }
            }}
        >
            <span class="custom-settings-toggle__icon" aria-hidden="true">
                <CheckmarkIcon isChecked={isCustom} />
            </span>
            <span class="custom-settings-toggle__label">
                {getLocalMessage('only_for')} <span class="custom-settings-toggle__url">{urlText}</span>
            </span>
        </Button>
    );
}
