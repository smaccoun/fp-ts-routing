"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url = require("url");
var querystring = require("querystring");
var Option_1 = require("fp-ts/lib/Option");
var function_1 = require("fp-ts/lib/function");
var array = require("fp-ts/lib/Array");
var t = require("io-ts");
var IntegerFromString_1 = require("io-ts-types/lib/number/IntegerFromString");
var isObjectEmpty = function (o) {
    for (var _ in o) {
        return false;
    }
    return true;
};
var Route = /** @class */ (function () {
    function Route(parts, query) {
        this.parts = parts;
        this.query = query;
    }
    Route.prototype.toString = function (encode) {
        if (encode === void 0) { encode = true; }
        var qs = querystring.stringify(this.query);
        var parts = encode ? this.parts.map(encodeURIComponent) : this.parts;
        return '/' + parts.join('/') + (qs ? '?' + qs : '');
    };
    Route.empty = new Route([], {});
    Route.isEmpty = function (r) { return r.parts.length === 0 && isObjectEmpty(r.query); };
    Route.parse = function (s, decode) {
        if (decode === void 0) { decode = true; }
        var route = url.parse(s, true);
        var parts = Option_1.fromNullable(route.pathname)
            .map(function (s) {
            var r = s.split('/').filter(Boolean);
            return decode ? r.map(decodeURIComponent) : r;
        })
            .getOrElse([]);
        return new Route(parts, route.query);
    };
    return Route;
}());
exports.Route = Route;
var assign = function (a) { return function (b) { return Object.assign({}, a, b); }; };
var Parser = /** @class */ (function () {
    function Parser(run) {
        this.run = run;
    }
    Parser.prototype.map = function (f) {
        return this.chain(function (a) { return Parser.of(f(a)); }); // <= derived
    };
    Parser.prototype.ap = function (fab) {
        var _this = this;
        return fab.chain(function (f) { return _this.map(f); }); // <= derived
    };
    Parser.prototype.chain = function (f) {
        var _this = this;
        return new Parser(function (r) { return _this.run(r).chain(function (_a) {
            var a = _a[0], r2 = _a[1];
            return f(a).run(r2);
        }); });
    };
    Parser.prototype.alt = function (that) {
        var _this = this;
        return new Parser(function (r) { return _this.run(r).alt(that.run(r)); });
    };
    /** A mapped Monoidal.mult */
    Parser.prototype.then = function (that) {
        return that.ap(this.map(assign));
    };
    Parser.of = function (a) { return new Parser(function (s) { return Option_1.some(function_1.tuple(a, s)); }); };
    return Parser;
}());
exports.Parser = Parser;
exports.zero = function () { return new Parser(function () { return Option_1.none; }); };
exports.parse = function (parser, r, a) {
    return parser
        .run(r)
        .map(function (_a) {
        var a = _a[0];
        return a;
    })
        .getOrElse(a);
};
exports.format = function (formatter, a, encode) {
    if (encode === void 0) { encode = true; }
    return formatter.run(Route.empty, a).toString(encode);
};
var Formatter = /** @class */ (function () {
    function Formatter(run) {
        this.run = run;
    }
    Formatter.prototype.contramap = function (f) {
        var _this = this;
        return new Formatter(function (r, b) { return _this.run(r, f(b)); });
    };
    Formatter.prototype.then = function (that) {
        var _this = this;
        return new Formatter(function (r, ab) { return that.run(_this.run(r, ab), ab); });
    };
    return Formatter;
}());
exports.Formatter = Formatter;
var Match = /** @class */ (function () {
    function Match(parser, formatter) {
        this.parser = parser;
        this.formatter = formatter;
    }
    Match.prototype.imap = function (f, g) {
        return new Match(this.parser.map(f), this.formatter.contramap(g));
    };
    Match.prototype.then = function (that) {
        var p = this.parser.then(that.parser);
        var f = this.formatter.then(that.formatter);
        return new Match(p, f);
    };
    return Match;
}());
exports.Match = Match;
var singleton = function (k, v) {
    var _a;
    return (_a = {}, _a[k] = v, _a);
};
/** `succeed` matches everything but consumes nothing */
exports.succeed = function (a) {
    return new Match(new Parser(function (r) { return Option_1.some(function_1.tuple(a, r)); }), new Formatter(function_1.identity));
};
/** `end` matches the end of a route */
exports.end = new Match(new Parser(function (r) { return (Route.isEmpty(r) ? Option_1.some(function_1.tuple({}, r)) : Option_1.none); }), new Formatter(function_1.identity));
/** `type` matches any io-ts type path component */
exports.type = function (k, type) {
    return new Match(new Parser(function (r) {
        return array.fold(r.parts, Option_1.none, function (head, tail) {
            return Option_1.fromEither(type.decode(head)).map(function (a) { return function_1.tuple(singleton(k, a), new Route(tail, r.query)); });
        });
    }), new Formatter(function (r, o) { return new Route(r.parts.concat(type.encode(o[k])), r.query); }));
};
/** `str` matches any string path component */
exports.str = function (k) { return exports.type(k, t.string); };
/** `int` matches any integer path component */
exports.int = function (k) { return exports.type(k, IntegerFromString_1.IntegerFromString); };
/**
 * `lit(x)` will match exactly the path component `x`
 * For example, `lit('x')` matches `/x`
 */
exports.lit = function (literal) {
    return new Match(new Parser(function (r) {
        return array.fold(r.parts, Option_1.none, function (head, tail) { return (head === literal ? Option_1.some(function_1.tuple({}, new Route(tail, r.query))) : Option_1.none); });
    }), new Formatter(function (r, n) { return new Route(r.parts.concat(literal), r.query); }));
};
exports.query = function (type) {
    return new Match(new Parser(function (r) { return Option_1.fromEither(type.decode(r.query)).map(function (query) { return function_1.tuple(query, new Route(r.parts, {})); }); }), new Formatter(function (r, query) { return new Route(r.parts, type.encode(query)); }));
};
//# sourceMappingURL=index.js.map