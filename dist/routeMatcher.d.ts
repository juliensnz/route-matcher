type SplitPath<Path extends string> = Path extends `${infer Head}/${infer Tail}` ? Head extends '' ? SplitPath<Tail> : [Head, ...SplitPath<Tail>] : Path extends '' ? [] : [Path];
type GetPathParams<Path extends string, Parts = SplitPath<Path>> = Parts extends [infer Head, ...infer Tail] ? Head extends `:${infer Name}` ? {
    [K in Name]: string;
} & GetPathParams<Path, Tail> : GetPathParams<Path, Tail> : object;
type RouteMatcher = {
    match: <Path extends string>(path: Path, callBack: (parameters: GetPathParams<Path>) => Promise<boolean | undefined | void>) => RouteMatcher;
    result: () => Promise<boolean | undefined | void>;
};
declare const routeMatcher: (urlToTest: string) => RouteMatcher;
export { routeMatcher };
