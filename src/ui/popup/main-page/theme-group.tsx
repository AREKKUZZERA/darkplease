import {m} from 'malevic';
import {useState, withState} from 'malevic/state';
import {compose} from '../../utils';

import type {Theme, ViewProps} from '../../../definitions';
import {generateUID} from '../../../utils/uid';
import {Button} from '../../controls';
import {Brightness, Contrast, Scheme, Mode} from '../theme/controls';
import ThemePresetPicker from '../theme/preset-picker';
import {getCurrentThemePreset} from '../theme/utils';

function ThemeControls(props: {theme: Theme; onChange: (theme: Partial<Theme>) => void}) {
    const {theme, onChange} = props;
    return (
        <section class="m-section m-theme-controls">
            <Brightness
                value={theme.brightness}
                onChange={(v) => onChange({brightness: v})}
            />
            <Contrast
                value={theme.contrast}
                onChange={(v) => onChange({contrast: v})}
            />
            <Scheme
                isDark={theme.mode === 1}
                onChange={(isDark) => onChange({mode: isDark ? 1 : 0})}
            />
            <Mode
                mode={theme.engine}
                onChange={(mode) => onChange({engine: mode})}
            />
        </section>
    );
}

const MAX_ALLOWED_PRESETS = 3;

interface SavePresetRowProps extends ViewProps {
    currentTheme: Theme;
}

function SavePresetRow(props: SavePresetRowProps) {
    const {state, setState} = useState<{inputVisible: boolean; name: string}>({
        inputVisible: false,
        name: '',
    });

    const canAddPreset = props.data.settings.presets.length < MAX_ALLOWED_PRESETS;
    if (!canAddPreset) {
        return null;
    }

    function showInput() {
        const nextNum = props.data.settings.presets.length + 1;
        setState({inputVisible: true, name: `Theme ${nextNum}`});
    }

    function save() {
        const name = state.name.trim() || `Theme ${props.data.settings.presets.length + 1}`;
        const newPreset = {
            id: `preset-${generateUID()}`,
            name,
            urls: [],
            theme: {...props.currentTheme},
        };
        props.actions.changeSettings({
            presets: [...props.data.settings.presets, newPreset],
        });
        setState({inputVisible: false, name: ''});
    }

    function cancel() {
        setState({inputVisible: false, name: ''});
    }

    if (!state.inputVisible) {
        return (
            <button
                class="theme-group__save-preset-btn"
                onclick={showInput}
                title="Save current theme as a named preset"
            >
                ＋ Save as preset
            </button>
        );
    }

    return (
        <div class="theme-group__save-preset-row">
            <input
                class="theme-group__save-preset-input"
                type="text"
                value={state.name}
                placeholder="Preset name"
                oninput={(e: Event) => setState({name: (e.target as HTMLInputElement).value})}
                onkeydown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        save();
                    }
                    if (e.key === 'Escape') {
                        cancel();
                    }
                }}
                oncreate={(el: HTMLInputElement) => {
                    el.select();
                }}
            />
            <button class="theme-group__save-preset-confirm" onclick={save} title="Save">✓</button>
            <button class="theme-group__save-preset-cancel" onclick={cancel} title="Cancel">✕</button>
        </div>
    );
}

const SavePresetRowStateful = compose(SavePresetRow, withState);

function ThemeGroupInner(props: ViewProps & {onThemeNavClick: () => void}) {
    const preset = getCurrentThemePreset(props);

    return (
        <div class="theme-group">
            <div class="theme-group__presets-wrapper">
                <ThemePresetPicker {...props} />
            </div>
            <div class="theme-group__controls-wrapper">
                <ThemeControls
                    theme={preset.theme}
                    onChange={preset.change}
                />
                <SavePresetRowStateful {...props} currentTheme={preset.theme} />
                <Button class="theme-group__more-button" onclick={props.onThemeNavClick}>
                    See all options
                </Button>
            </div>
            <label class="theme-group__description">
                Configure theme
            </label>
        </div>
    );
}

export default ThemeGroupInner;
