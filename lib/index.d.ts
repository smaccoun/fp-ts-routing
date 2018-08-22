import { Option } from 'fp-ts/lib/Option';
import * as t from 'io-ts';
export interface Query {
    [key: string]: string | Array<string> | undefined;
}
export declare class Route {
    readonly parts: Array<string>;
    readonly query: Query;
    static empty: Route;
    constructor(parts: Array<string>, query: Query);
    static isEmpty: (r: Route) => boolean;
    static parse: (s: string, decode?: boolean) => Route;
    toString(encode?: boolean): string;
}
/**
 * Encodes the constraint that a given object `O`
 * does not contain specific keys `K`
 */
export declare type RowLacks<O extends object, K extends string | number | symbol> = O & Record<Extract<keyof O, K>, never>;
export declare class Parser<A extends object> {
    readonly run: (r: Route) => Option<[A, Route]>;
    readonly _A: A;
    constructor(run: (r: Route) => Option<[A, Route]>);
    static of: <A_1 extends object>(a: A_1) => Parser<A_1>;
    map<B extends object>(f: (a: A) => B): Parser<B>;
    ap<B extends object>(fab: Parser<(a: A) => B>): Parser<B>;
    chain<B extends object>(f: (a: A) => Parser<B>): Parser<B>;
    alt(that: Parser<A>): Parser<A>;
    /** A mapped Monoidal.mult */
    then<B extends object>(that: Parser<RowLacks<B, keyof A>>): Parser<A & B>;
}
export declare const zero: <A extends object>() => Parser<A>;
export declare const parse: <A extends object>(parser: Parser<A>, r: Route, a: A) => A;
export declare const format: <A extends object>(formatter: Formatter<A>, a: A, encode?: boolean) => string;
export declare class Formatter<A extends object> {
    readonly run: (r: Route, a: A) => Route;
    readonly _A: A;
    constructor(run: (r: Route, a: A) => Route);
    contramap<B extends object>(f: (b: B) => A): Formatter<B>;
    then<B extends object>(that: Formatter<B> & Formatter<RowLacks<B, keyof A>>): Formatter<A & B>;
}
export declare class Match<A extends object> {
    readonly parser: Parser<A>;
    readonly formatter: Formatter<A>;
    readonly _A: A;
    constructor(parser: Parser<A>, formatter: Formatter<A>);
    imap<B extends object>(f: (a: A) => B, g: (b: B) => A): Match<B>;
    then<B extends object>(that: Match<B> & Match<RowLacks<B, keyof A>>): Match<A & B>;
}
/** `succeed` matches everything but consumes nothing */
export declare const succeed: <A extends object>(a: A) => Match<A>;
/** `end` matches the end of a route */
export declare const end: Match<{}>;
/** `type` matches any io-ts type path component */
export declare const type: <K extends string, A>(k: K, type: t.Type<A, string, t.mixed>) => Match<{ [_ in K]: A; }>;
/** `str` matches any string path component */
export declare const str: <K extends string>(k: K) => Match<{ [_ in K]: string; }>;
/** `int` matches any integer path component */
export declare const int: <K extends string>(k: K) => Match<{ [_ in K]: number; }>;
/**
 * `lit(x)` will match exactly the path component `x`
 * For example, `lit('x')` matches `/x`
 */
export declare const lit: (literal: string) => Match<{}>;
export declare const query: <A extends object>(type: t.Type<A, Query, t.mixed>) => Match<A>;
