import {m} from 'malevic';

import type {ExtWrapper, Theme} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {isURLInList} from '../../../../utils/url';
import {Slider} from '../../../controls';
import CustomSettingsToggle from '../custom-settings-toggle';

import ModeToggle from './mode-toggle';

function formatPercent(v: number) {
    return `${v}%`;
}

function SliderRow(props: {label: string; value: number; min: number; max: number; colorClass: string; onChange: (v: number) => void}) {
    return (
        <div class="filter-slider-row">
            <div class="filter-slider-row__header">
                <span class="filter-slider-row__label">{props.label}</span>
                <span class="filter-slider-row__value">{props.value}</span>
            </div>
            <Slider
                value={props.value}
                min={props.min}
                max={props.max}
                step={1}
                formatValue={formatPercent}
                onChange={props.onChange}
            />
        </div>
    );
}

export default function FilterSettings({data, actions}: ExtWrapper, ...children: Malevic.Child[]) {
    const custom = data.settings.customThemes.find(({url}) => isURLInList(data.activeTab.url, url));
    const theme = custom ? custom.theme : data.settings.theme;

    function setConfig(config: Partial<Theme>) {
        if (custom) {
            custom.theme = {...custom.theme, ...config};
            actions.changeSettings({customThemes: data.settings.customThemes});
        } else {
            actions.setTheme(config);
        }
    }

    return (
        <section class="filter-settings">
            <ModeToggle mode={theme.mode} onChange={(mode) => setConfig({mode})} />
            <SliderRow
                label={getLocalMessage('brightness')}
                value={theme.brightness}
                min={50} max={150}
                colorClass="brightness"
                onChange={(v) => setConfig({brightness: v})}
            />
            <SliderRow
                label={getLocalMessage('contrast')}
                value={theme.contrast}
                min={50} max={150}
                colorClass="contrast"
                onChange={(v) => setConfig({contrast: v})}
            />
            <SliderRow
                label={getLocalMessage('sepia')}
                value={theme.sepia}
                min={0} max={100}
                colorClass="sepia"
                onChange={(v) => setConfig({sepia: v})}
            />
            <SliderRow
                label={getLocalMessage('grayscale')}
                value={theme.grayscale}
                min={0} max={100}
                colorClass="grayscale"
                onChange={(v) => setConfig({grayscale: v})}
            />
            <CustomSettingsToggle data={data} actions={actions} />
            <div class="filter-settings__content">
                {...children}
            </div>
        </section>
    );
}
