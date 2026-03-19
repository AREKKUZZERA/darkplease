import {createNodeAsap, removeNode} from './utils/dom';

export function createOrUpdateStyle(css: string, type: string): void {
    createNodeAsap({
        selectNode: () => document.getElementById('darkplease-style')!,
        createNode: (target) => {
            document.documentElement.setAttribute('data-darkplease-mode', type);
            const style = document.createElement('style');
            style.id = 'darkplease-style';
            style.classList.add('darkplease');
            style.type = 'text/css';
            style.textContent = css;
            target.appendChild(style);
        },
        updateNode: (existing) => {
            if (css.replace(/^\s+/gm, '') !== existing.textContent!.replace(/^\s+/gm, '')) {
                existing.textContent = css;
            }
        },
        selectTarget: () => document.head,
        createTarget: () => {
            const head = document.createElement('head');
            document.documentElement.insertBefore(head, document.documentElement.firstElementChild);
            return head;
        },
        isTargetMutation: (mutation) => mutation.target.nodeName.toLowerCase() === 'head',
    });
}

export function removeStyle(): void {
    removeNode(document.getElementById('darkplease-style'));
    document.documentElement.removeAttribute('data-darkplease-mode');
}
