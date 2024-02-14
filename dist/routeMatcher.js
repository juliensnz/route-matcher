"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMatcher = void 0;
const arraysContainSameElements = (array1, array2) => {
    const sortedArray1 = [...array1].sort();
    const sortedArray2 = [...array2].sort();
    return (sortedArray1.length === sortedArray2.length && sortedArray1.every((value, index) => sortedArray2[index] === value));
};
const pathToRegExp = (path) => {
    const pattern = path
        // Escape literal dots
        .replace(/\./g, '\\.')
        // Escape literal slashes
        .replace(/\//g, '/')
        // Escape literal question marks
        .replace(/\?/g, '\\?')
        // Ignore trailing slashes
        .replace(/\/+$/, '')
        // Replace wildcard with any zero-to-any character sequence
        .replace(/\*+/g, '.*')
        // Replace parameters with named capturing groups
        .replace(/:([^\d|^/][a-zA-Z0-9_]*(?=(?:\/|\\.)|$))/g, (_, paramName) => `(?<${paramName}>[^/]+?)`)
        // Allow optional trailing slash
        .concat('(\\/|$)');
    return new RegExp(pattern, 'gi');
};
const routeMatcher = (urlToTest) => {
    // This matcher is used when the route has been matched to make sure that we don't execute other matchers
    const completedMatcher = (result) => ({
        match: () => completedMatcher(result),
        result: async () => undefined === await result ? true : await result,
    });
    const matcher = {
        match: (path, callBack) => {
            const urlToTestWithoutQueryParameters = urlToTest.split('?')[0];
            const parametersMatches = path.match(/\/:([^/]+)/g);
            const parameters = parametersMatches ? parametersMatches.map(match => match.slice(2)) : [];
            const regex = pathToRegExp(path);
            const match = regex.exec(urlToTestWithoutQueryParameters);
            const matches = !!match && match[0] === match.input;
            if (!match || !matches) {
                return matcher;
            }
            if (!arraysContainSameElements(Object.keys(match.groups || {}), parameters)) {
                /* istanbul ignore next Not possible to test as the regexp should not be able to generate this */
                return matcher;
            }
            const callbackResult = callBack((match.groups || {}));
            return {
                match: () => completedMatcher(callbackResult),
                result: async () => undefined === await callbackResult ? true : await callbackResult,
            };
        },
        result: () => Promise.resolve(false),
    };
    return matcher;
};
exports.routeMatcher = routeMatcher;
