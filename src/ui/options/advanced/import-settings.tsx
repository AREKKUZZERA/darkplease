import {m} from 'malevic';
import {getContext} from 'malevic/dom';

import type {UserSettings, ViewProps} from '../../../definitions';
import type {DEFAULT_THEME} from '../../../defaults';
import {validateSettings} from '../../../utils/validation';
import {Button, ControlGroup, MessageBox} from '../../controls';
import {openFile} from '../../utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Keys shown in the preview diff (flat scalars only — arrays/objects summarised). */
const PREVIEW_KEYS: Array<keyof UserSettings> = [
    'enabled',
    'enabledByDefault',
    'detectDarkTheme',
    'enableForPDF',
    'enableForProtectedPages',
    'enableContextMenus',
    'syncSettings',
    'syncSitesFixes',
    'changeBrowserTheme',
];

const THEME_PREVIEW_KEYS: Array<keyof typeof DEFAULT_THEME> = [
    'mode',
    'brightness',
    'contrast',
    'sepia',
    'grayscale',
    'engine',
];

interface DiffLine {
    key: string;
    from: string;
    to: string;
    changed: boolean;
}

function formatValue(v: unknown): string {
    if (typeof v === 'boolean') {
        return v ? 'on' : 'off';
    }
    if (v === null || v === undefined) {
        return '—';
    }
    return String(v);
}

function buildDiff(current: UserSettings, incoming: UserSettings): DiffLine[] {
    const lines: DiffLine[] = [];

    for (const key of PREVIEW_KEYS) {
        const from = formatValue(current[key]);
        const to = formatValue(incoming[key]);
        lines.push({key: String(key), from, to, changed: from !== to});
    }

    for (const key of THEME_PREVIEW_KEYS) {
        const from = formatValue(current.theme[key]);
        const to = formatValue((incoming.theme ?? {})[key]);
        lines.push({key: `theme.${key}`, from, to, changed: from !== to});
    }

    lines.push({
        key: 'presets (count)',
        from: String(current.presets.length),
        to: String(incoming.presets.length),
        changed: current.presets.length !== incoming.presets.length,
    });

    const disabledDiff = current.disabledFor.length !== incoming.disabledFor.length;
    lines.push({
        key: 'disabledFor (count)',
        from: String(current.disabledFor.length),
        to: String(incoming.disabledFor.length),
        changed: disabledDiff,
    });

    return lines;
}

// ─── Preview Dialog ──────────────────────────────────────────────────────────

interface PreviewDialogProps {
    diff: DiffLine[];
    onApply: () => void;
    onCancel: () => void;
}

function PreviewDialog({diff, onApply, onCancel}: PreviewDialogProps) {
    const changedCount = diff.filter((d) => d.changed).length;

    return (
        <div class="import-preview-overlay" onclick={onCancel}>
            <div class="import-preview" onclick={(e: MouseEvent) => e.stopPropagation()}>
                <div class="import-preview__header">
                    <span class="import-preview__title">Import preview</span>
                    <span class="import-preview__subtitle">
                        {changedCount === 0
                            ? 'No changes detected'
                            : `${changedCount} setting${changedCount === 1 ? '' : 's'} will change`}
                    </span>
                </div>

                <div class="import-preview__table-wrap">
                    <table class="import-preview__table">
                        <thead>
                            <tr>
                                <th>Setting</th>
                                <th>Current</th>
                                <th>New</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diff.map((line) => (
                                <tr class={{'import-preview__row--changed': line.changed}}>
                                    <td class="import-preview__key">{line.key}</td>
                                    <td class="import-preview__val import-preview__val--from">{line.from}</td>
                                    <td class="import-preview__val import-preview__val--to">{line.to}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div class="import-preview__actions">
                    <Button class="import-preview__btn import-preview__btn--cancel" onclick={onCancel}>
                        Cancel
                    </Button>
                    <Button class="import-preview__btn import-preview__btn--apply" onclick={onApply}>
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ImportSettings(props: ViewProps): Malevic.Child {
    const context = getContext();

    // store shape: { errorCaption, showError, diff, pendingSettings }
    const store = context.getStore<{
        errorCaption: string | null;
        showError: boolean;
        diff: DiffLine[] | null;
        pendingSettings: UserSettings | null;
    }>({errorCaption: null, showError: false, diff: null, pendingSettings: null});

    function showError(caption: string) {
        store.errorCaption = caption;
        store.showError = true;
        context.refresh();
    }

    function hideError() {
        store.showError = false;
        context.refresh();
    }

    function applyImport() {
        if (!store.pendingSettings) {
            return;
        }
        props.actions.changeSettings(store.pendingSettings);
        store.diff = null;
        store.pendingSettings = null;
        context.refresh();
    }

    function cancelImport() {
        store.diff = null;
        store.pendingSettings = null;
        context.refresh();
    }

    function startImport() {
        openFile({extensions: ['json']}, (result: string) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(result);
            } catch {
                showError('Failed to read file — not valid JSON');
                return;
            }

            const {settings, errors} = validateSettings(parsed as Partial<UserSettings>);
            if (errors.length) {
                const detail = errors.length > 1
                    ? `${errors.length} errors, including: ${errors[0]}`
                    : errors[0];
                showError(`Invalid settings file: ${detail}`);
                return;
            }

            store.diff = buildDiff(props.data.settings, settings as UserSettings);
            store.pendingSettings = settings as UserSettings;
            context.refresh();
        });
    }

    const errorDialog = store.showError ? (
        <MessageBox
            caption={store.errorCaption!}
            onOK={hideError}
            onCancel={hideError}
            hideCancel={true}
        />
    ) : null;

    const previewDialog = store.diff ? (
        <PreviewDialog
            diff={store.diff}
            onApply={applyImport}
            onCancel={cancelImport}
        />
    ) : null;

    return (
        <ControlGroup>
            <ControlGroup.Control>
                <Button
                    onclick={startImport}
                    class="advanced__import-settings-button"
                >
                    Import Settings
                    {errorDialog}
                    {previewDialog}
                </Button>
            </ControlGroup.Control>
            <ControlGroup.Description>
                Open settings from a JSON file — preview changes before applying
            </ControlGroup.Description>
        </ControlGroup>
    );
}
