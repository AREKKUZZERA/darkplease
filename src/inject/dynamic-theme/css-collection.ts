import {forEach} from '../../utils/array';
import {formatCSS} from '../../utils/css-text/format-css';
import {loadAsDataURL} from '../../utils/network';
import {getMatches} from '../../utils/text';

const blobRegex = /url\(\"(blob\:.*?)\"\)/g;

async function replaceBlobs(text: string) {
    const promises: Array<Promise<string>> = [];
    getMatches(blobRegex, text, 1).forEach((url) => {
        const promise = loadAsDataURL(url);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return text.replace(blobRegex, () => `url("${data.shift()}")`);
}

const banner = `/*
                https://github.com/AREKKUZZERA/darkplease
*/

/*! DARK PLEASE! generated CSS | Licensed under MIT https://github.com/AREKKUZZERA/darkplease/blob/main/LICENSE */
`;

export async function collectCSS(): Promise<string> {
    const css = [banner];

    function addStaticCSS(selector: string, comment: string) {
        const staticStyle = document.querySelector(selector);
        if (staticStyle && staticStyle.textContent) {
            css.push(`/* ${comment} */`);
            css.push(staticStyle.textContent);
            css.push('');
        }
    }

    addStaticCSS('.darkplease--fallback', 'Fallback Style');
    addStaticCSS('.darkplease--user-agent', 'User-Agent Style');
    addStaticCSS('.darkplease--text', 'Text Style');
    addStaticCSS('.darkplease--invert', 'Invert Style');
    addStaticCSS('.darkplease--variables', 'Variables Style');

    const modifiedCSS: string[] = [];
    document.querySelectorAll('.darkplease--sync').forEach((element: HTMLStyleElement) => {
        forEach(element.sheet!.cssRules, (rule) => {
            rule && rule.cssText && modifiedCSS.push(rule.cssText);
        });
    });

    if (modifiedCSS.length) {
        const formattedCSS = formatCSS(modifiedCSS.join('\n'));
        css.push('/* Modified CSS */');
        css.push(await replaceBlobs(formattedCSS));
        css.push('');
    }

    addStaticCSS('.darkplease--override', 'Override Style');

    return css.join('\n');
}
