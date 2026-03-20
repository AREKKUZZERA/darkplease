// @ts-check

/**
 * @typedef {import('eslint').Rule.RuleContext & {
 *   markVariableAsUsed?: (name: string) => void
 * }} RuleContextWithMarkVariableAsUsed
 */

/**
 * @type {{[ruleName: string]: import('eslint').Rule.RuleModule}}
 */
export const localRules = {
    'jsx-uses-m-pragma': {
        create(context) {
            /** @type {RuleContextWithMarkVariableAsUsed} */
            const extendedContext = context;

            const pragma = 'm';
            const usePragma = () => extendedContext.markVariableAsUsed?.(pragma);

            return {
                JSXOpeningElement: usePragma,
                JSXOpeningFragment: usePragma,
            };
        },
    },
    'jsx-uses-vars': {
        create(context) {
            /** @type {RuleContextWithMarkVariableAsUsed} */
            const extendedContext = context;

            return {
                /**
                 * @param {{ name: any; }} node
                 */
                JSXOpeningElement(node) {
                    let variable;
                    const jsxTag = node.name;

                    if (jsxTag.type === 'JSXIdentifier') {
                        variable = jsxTag.name;
                    } else if (jsxTag.type === 'JSXMemberExpression') {
                        variable = jsxTag.object.name;
                    } else {
                        console.warn('Unsupported JSX identifier', jsxTag);
                    }

                    if (variable) {
                        extendedContext.markVariableAsUsed?.(variable);
                    }
                },
            };
        },
    },
};
