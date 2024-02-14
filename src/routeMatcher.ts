const arraysContainSameElements = (array1: unknown[], array2: unknown[]) => {
  const sortedArray1 = [...array1].sort();
  const sortedArray2 = [...array2].sort();

  return (
    sortedArray1.length === sortedArray2.length && sortedArray1.every((value, index) => sortedArray2[index] === value)
  );
};

type SplitPath<Path extends string> = Path extends `${infer Head}/${infer Tail}`
  ? Head extends ''
    ? SplitPath<Tail>
    : [Head, ...SplitPath<Tail>]
  : Path extends ''
    ? []
    : [Path];

type GetPathParams<Path extends string, Parts = SplitPath<Path>> = Parts extends [infer Head, ...infer Tail]
  ? Head extends `:${infer Name}`
    ? {[K in Name]: string} & GetPathParams<Path, Tail>
    : GetPathParams<Path, Tail>
  : object;

const pathToRegExp = (path: string): RegExp => {
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

type RouteMatcher = {
  match: <Path extends string>(
    path: Path,
    callBack: (parameters: GetPathParams<Path>) => Promise<boolean | undefined | void>
  ) => RouteMatcher;
  result: () => Promise<boolean | undefined | void>;
};

const routeMatcher = (urlToTest: string) => {
  // This matcher is used when the route has been matched to make sure that we don't execute other matchers
  const completedMatcher = (result: Promise<boolean | undefined | void>): RouteMatcher => ({
    match: (): RouteMatcher => completedMatcher(result),
    result: async (): Promise<boolean> => undefined === await result ? true : (await result as boolean),
  });

  const matcher: RouteMatcher = {
    match: <Path extends string>(
      path: Path,
      callBack: (parameters: GetPathParams<Path>) => Promise<boolean | undefined | void>
    ): RouteMatcher => {
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

      const callbackResult = callBack((match.groups || {}) as GetPathParams<Path>);

      return {
        match: () => completedMatcher(callbackResult),
        result: async () => undefined === await callbackResult ? true : (await callbackResult as boolean),
      };
    },
    result: () => Promise.resolve(false),
  };

  return matcher;
};

export {routeMatcher};
