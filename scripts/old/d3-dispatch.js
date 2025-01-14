// https://d3js.org/d3-dispatch/ v3.0.1 Copyright 2010-2021 Mike Bostock
! function(n, e) {
    "object" == typeof exports && "undefined" != typeof module ? e(exports) : "function" == typeof define && define.amd ? define(["exports"], e) : e((n = "undefined" != typeof globalThis ? globalThis : n || self).d3 = n.d3 || {})
}(this, (function(n) {
    "use strict";
    var e = {
        value: () => {}
    };

    function t() {
        for (var n, e = 0, t = arguments.length, o = {}; e < t; ++e) {
            if (!(n = arguments[e] + "") || n in o || /[\s.]/.test(n)) throw new Error("illegal type: " + n);
            o[n] = []
        }
        return new r(o)
    }

    function r(n) {
        this._ = n
    }

    function o(n, e) {
        return n.trim().split(/^|\s+/).map((function(n) {
            var t = "",
                r = n.indexOf(".");
            if (r >= 0 && (t = n.slice(r + 1), n = n.slice(0, r)), n && !e.hasOwnProperty(n)) throw new Error("unknown type: " + n);
            return {
                type: n,
                name: t
            }
        }))
    }

    function i(n, e) {
        for (var t, r = 0, o = n.length; r < o; ++r)
            if ((t = n[r]).name === e) return t.value
    }

    function f(n, t, r) {
        for (var o = 0, i = n.length; o < i; ++o)
            if (n[o].name === t) {
                n[o] = e, n = n.slice(0, o).concat(n.slice(o + 1));
                break
            } return null != r && n.push({
            name: t,
            value: r
        }), n
    }
    r.prototype = t.prototype = {
        constructor: r,
        on: function(n, e) {
            var t, r = this._,
                l = o(n + "", r),
                a = -1,
                u = l.length;
            if (!(arguments.length < 2)) {
                if (null != e && "function" != typeof e) throw new Error("invalid callback: " + e);
                for (; ++a < u;)
                    if (t = (n = l[a]).type) r[t] = f(r[t], n.name, e);
                    else if (null == e)
                    for (t in r) r[t] = f(r[t], n.name, null);
                return this
            }
            for (; ++a < u;)
                if ((t = (n = l[a]).type) && (t = i(r[t], n.name))) return t
        },
        copy: function() {
            var n = {},
                e = this._;
            for (var t in e) n[t] = e[t].slice();
            return new r(n)
        },
        call: function(n, e) {
            if ((t = arguments.length - 2) > 0)
                for (var t, r, o = new Array(t), i = 0; i < t; ++i) o[i] = arguments[i + 2];
            if (!this._.hasOwnProperty(n)) throw new Error("unknown type: " + n);
            for (i = 0, t = (r = this._[n]).length; i < t; ++i) r[i].value.apply(e, o)
        },
        apply: function(n, e, t) {
            if (!this._.hasOwnProperty(n)) throw new Error("unknown type: " + n);
            for (var r = this._[n], o = 0, i = r.length; o < i; ++o) r[o].value.apply(e, t)
        }
    }, n.dispatch = t, Object.defineProperty(n, "__esModule", {
        value: !0
    })
}));
