import type {PLATFORM} from './platform';

export type PlatformId = (typeof PLATFORM)[keyof (typeof PLATFORM)];
export type BuildPlatforms = Record<PlatformId, boolean>;
export type LogLevel = 'info' | 'warn' | 'assert' | false | null;
export type HashDigest = Partial<Record<'md5' | 'sha1' | 'sha256', string>>;

export interface BuildTaskOptions {
    release: boolean;
    debug: boolean;
    platforms: BuildPlatforms;
    watch: boolean;
    log: LogLevel;
    test: boolean;
    version: string | false | null;
}

export interface Manifest {
    name?: string;
    version?: string;
    version_name?: string;
    description?: string;
    browser_action?: unknown;
    permissions: string[];
    [key: string]: unknown;
}

export interface ZipDetails {
    files: string[];
    dest: string;
    cwd: string;
    date: Date;
    mode: number;
}

export interface HashEntry {
    archivePath: string;
    realPath?: string;
    isOptional?: boolean;
    integrity?: HashDigest;
}

export interface SignatureManifestSettings {
    indent?: number;
    settings?: number;
}

export interface SignatureInfo {
    type: 0 | 1 | 2;
    order?: number[];
    manifest?: SignatureManifestSettings;
}

export interface JSEntry {
    src: string;
    dest: string;
    reloadType: string;
    watchFiles?: string[];
    platform?: PlatformId;
}

export interface CSSEntry {
    src: string;
    dest: string;
    watchFiles?: string[];
}

export interface HTMLEntry {
    title: string;
    path: string;
    hasLoader: boolean;
    hasStyleSheet: boolean;
    hasCompatibilityCheck: boolean;
    reloadType: string;
    platforms?: PlatformId[];
}

export interface CopyEntry {
    path: string;
    reloadType: string;
    platforms?: PlatformId[];
}

export interface TaskOptions {
    platforms: Partial<BuildPlatforms>;
    debug: boolean;
    watch: boolean;
    test: boolean;
    log?: LogLevel;
    version: string | false | null;
}
