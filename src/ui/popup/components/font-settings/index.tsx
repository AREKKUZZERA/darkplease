import {m} from 'malevic';

import type {Theme} from '../../../../definitions';
import {getLocalMessage} from '../../../../utils/locales';
import {CheckBox, Slider, Select} from '../../../controls';

interface FontSettingsProps {
    config: Theme;
    fonts: string[];
    onChange: (config: Partial<Theme>) => void;
}

function formatStroke(v: number) {
    return `${v}`;
}

export default function FontSettings({config, fonts, onChange}: FontSettingsProps) {
    return (
        <section class="font-settings">
            <div class="font-settings__font-select-container">
                <div class="font-settings__font-select-container__line">
                    <CheckBox
                        checked={config.useFont}
                        onchange={(e: {target: HTMLInputElement}) => onChange({useFont: e.target.checked})}
                    />
                    <Select
                        value={config.fontFamily}
                        onChange={(value) =>
                            onChange({
                                fontFamily: value,
                                useFont: true,
                            })
                        }
                        options={fonts.reduce((map, font) => {
                            map[font] = (
                                <div style={{'font-family': font}}>
                                    {font}
                                </div>
                            );
                            return map;
                        }, {} as {[font: string]: Malevic.Spec})}
                    />
                </div>
                <label class="font-settings__font-select-container__label">
                    {getLocalMessage('select_font')}
                </label>
            </div>
            <div class="font-settings__stroke-row">
                <div class="font-settings__stroke-header">
                    <span class="font-settings__stroke-label">{getLocalMessage('text_stroke')}</span>
                    <span class="font-settings__stroke-value">{String(config.textStroke)}</span>
                </div>
                <Slider
                    value={config.textStroke}
                    min={0}
                    max={1}
                    step={0.1}
                    formatValue={formatStroke}
                    onChange={(value) => onChange({textStroke: value})}
                />
            </div>
        </section>
    );
}
