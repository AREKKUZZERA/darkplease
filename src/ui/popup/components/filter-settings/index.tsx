import {m} from 'malevic';

import type {ExtWrapper, Theme} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {isURLInList} from '../../../../utils/url';
import {Button, Slider} from '../../../controls';
import CustomSettingsToggle from '../custom-settings-toggle';

import ModeToggle from './mode-toggle';

function formatPercent(v: number) {
    return `${v}%`;
}

const DEFAULTS = {
    brightness: 100,
    contrast: 100,
    sepia: 0,
    grayscale: 0,
    blueLight: 0,
};

function SliderRow(props: {
    label: string;
    value: number;
    min: number;
    max: number;
    defaultVal: number;
    onChange: (v: number) => void;
}) {
    const isDefault = props.value === props.defaultVal;
    return (
        <div class="filter-slider-row">
            <div class="filter-slider-row__header">
                <span class="filter-slider-row__label">{props.label}</span>
                <span class={{'filter-slider-row__value': true, 'filter-slider-row__value--default': isDefault}}>
                    {String(props.value)}
                </span>
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

    function resetFilters() {
        setConfig(DEFAULTS);
    }

    const isAllDefault =
        theme.brightness === DEFAULTS.brightness &&
        theme.contrast === DEFAULTS.contrast &&
        theme.sepia === DEFAULTS.sepia &&
        theme.grayscale === DEFAULTS.grayscale &&
        theme.blueLight === DEFAULTS.blueLight;

    return (
        <section class="filter-settings">
            <ModeToggle mode={theme.mode} onChange={(mode) => setConfig({mode})} />
            <SliderRow
                label={getLocalMessage('brightness')}
                value={theme.brightness}
                min={50} max={150}
                defaultVal={DEFAULTS.brightness}
                onChange={(v) => setConfig({brightness: v})}
            />
            <SliderRow
                label={getLocalMessage('contrast')}
                value={theme.contrast}
                min={50} max={150}
                defaultVal={DEFAULTS.contrast}
                onChange={(v) => setConfig({contrast: v})}
            />
            <SliderRow
                label={getLocalMessage('sepia')}
                value={theme.sepia}
                min={0} max={100}
                defaultVal={DEFAULTS.sepia}
                onChange={(v) => setConfig({sepia: v})}
            />
            <SliderRow
                label={getLocalMessage('grayscale')}
                value={theme.grayscale}
                min={0} max={100}
                defaultVal={DEFAULTS.grayscale}
                onChange={(v) => setConfig({grayscale: v})}
            />
            <SliderRow
                label={getLocalMessage('blue_light')}
                value={theme.blueLight}
                min={0} max={100}
                defaultVal={DEFAULTS.blueLight}
                onChange={(v) => setConfig({blueLight: v})}
            />
            <Button
                class={{'filter-settings__reset-btn': true, 'filter-settings__reset-btn--hidden': isAllDefault}}
                onclick={resetFilters}
            >
                {'Reset'}
            </Button>
            <CustomSettingsToggle data={data} actions={actions} />
            <div class="filter-settings__content">
                {...children}
            </div>
        </section>
    );
}
