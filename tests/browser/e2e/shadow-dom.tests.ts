import {multiline} from '../../support/test-utils';
import type {StyleExpectations} from '../globals';

async function expectStyles(styles: StyleExpectations) {
    await expectPageStyles(expect, styles);
}

describe('Custom HTML elements', () => {
    // TODO: remove flakes and remove this line
    jest.retryTimes(10, {logErrorsBeforeRetry: true});

    it('Asynchronous define', async () => {
        await loadTestPage({
            '/': multiline(
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '</head>',
                '<body></body>',
                '</html>',
            ),
        });

        const tag = await pageUtils.evaluateScript(async () => {
            const tag = `elem-with-async-${crypto.randomUUID()}`;
            class ElementWitAsync extends HTMLElement {
                constructor() {
                    super();
                    const root = this.attachShadow({mode: 'open'});
                    setTimeout(() => root.innerHTML =
                        '<style>\
                            p { color: red; }\
                        </style>\
                        <p>\
                            Should be red initially and then change to green.\
                        </p>'
                    );
                }
            }

            customElements.define(tag, ElementWitAsync);
            const elem = document.createElement(tag);
            document.body.appendChild(elem);
            return tag;
        });

        await expectStyles([
            [[tag, 'p'], 'color', 'rgb(255, 26, 26)'],
        ]);

        await devtoolsUtils.paste(multiline(
            '*',
            '',
            'CSS',
            'p {',
            '    color: green !important;',
            '}',
        ));

        await expectStyles([
            [[tag, 'p'], 'color', 'rgb(0, 128, 0)'],
        ]);

        await devtoolsUtils.reset();
    });
});
