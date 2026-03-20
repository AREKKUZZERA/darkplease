if (!window.hasOwnProperty('chrome')) {
    window.chrome = {} as any;
}
if (!chrome.hasOwnProperty('runtime')) {
    chrome.runtime = {} as any;
}
if (!chrome.runtime.hasOwnProperty('onMessage')) {
    type AnyFunction = () => void;
    const listeners = new Set<AnyFunction>();
    (chrome.runtime as any).onMessage = {
        addListener: (listener: AnyFunction) => {
            listeners.add(listener);
        },
        removeListener: (listener: AnyFunction) => {
            listeners.delete(listener);
        },
    } as any;
    (chrome.runtime.onMessage as any)['__listeners__'] = listeners;
}
if (!chrome.runtime.hasOwnProperty('sendMessage')) {
    // Provide a no-op stub so isExtensionContextValid() returns true.
    // Individual tests that need messaging behaviour replace this via
    // stubChromeRuntimeMessage() in background-stub.ts.
    (chrome.runtime as any).sendMessage = (() : void => {}) as any;
}
