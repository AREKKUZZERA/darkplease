// Loaded with HTML/DOM only

export function multiline(...lines: string[]): string {
    if (lines.length < 1) {
        return '\n';
    }
    if (lines[lines.length - 1] !== '') {
        lines.push('');
    }
    return lines.join('\n');
}

export function timeout(delay: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, delay));
}

export function waitForEvent(eventName: string, ms = 4000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            document.removeEventListener(eventName, handler);
            reject(new Error(`waitForEvent("${eventName}") timed out after ${ms}ms`));
        }, ms);
        const handler = () => {
            clearTimeout(timer);
            resolve();
        };
        document.addEventListener(eventName, handler, {once: true});
    });
}
