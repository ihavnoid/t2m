// https://d3js.org/d3-timer/ v3.0.1 Copyright 2010-2021 Mike Bostock
! function(t, n) {
    "object" == typeof exports && "undefined" != typeof module ? n(exports) : "function" == typeof define && define.amd ? define(["exports"], n) : n((t = "undefined" != typeof globalThis ? globalThis : t || self).d3 = t.d3 || {})
}(this, (function(t) {
    "use strict";
    var n, e, o = 0,
        i = 0,
        r = 0,
        l = 0,
        u = 0,
        a = 0,
        s = "object" == typeof performance && performance.now ? performance : Date,
        c = "object" == typeof window && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(t) {
            setTimeout(t, 17)
        };

    function f() {
        return u || (c(_), u = s.now() + a)
    }

    function _() {
        u = 0
    }

    function m() {
        this._call = this._time = this._next = null
    }

    function p(t, n, e) {
        var o = new m;
        return o.restart(t, n, e), o
    }

    function w() {
        f(), ++o;
        for (var t, e = n; e;)(t = u - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
        --o
    }

    function d() {
        u = (l = s.now()) + a, o = i = 0;
        try {
            w()
        } finally {
            o = 0,
                function() {
                    var t, o, i = n,
                        r = 1 / 0;
                    for (; i;) i._call ? (r > i._time && (r = i._time), t = i, i = i._next) : (o = i._next, i._next = null, i = t ? t._next = o : n = o);
                    e = t, y(r)
                }(), u = 0
        }
    }

    function h() {
        var t = s.now(),
            n = t - l;
        n > 1e3 && (a -= n, l = t)
    }

    function y(t) {
        o || (i && (i = clearTimeout(i)), t - u > 24 ? (t < 1 / 0 && (i = setTimeout(d, t - s.now() - a)), r && (r = clearInterval(r))) : (r || (l = s.now(), r = setInterval(h, 1e3)), o = 1, c(d)))
    }
    m.prototype = p.prototype = {
        constructor: m,
        restart: function(t, o, i) {
            if ("function" != typeof t) throw new TypeError("callback is not a function");
            i = (null == i ? f() : +i) + (null == o ? 0 : +o), this._next || e === this || (e ? e._next = this : n = this, e = this), this._call = t, this._time = i, y()
        },
        stop: function() {
            this._call && (this._call = null, this._time = 1 / 0, y())
        }
    }, t.interval = function(t, n, e) {
        var o = new m,
            i = n;
        return null == n ? (o.restart(t, n, e), o) : (o._restart = o.restart, o.restart = function(t, n, e) {
            n = +n, e = null == e ? f() : +e, o._restart((function r(l) {
                l += i, o._restart(r, i += n, e), t(l)
            }), n, e)
        }, o.restart(t, n, e), o)
    }, t.now = f, t.timeout = function(t, n, e) {
        var o = new m;
        return n = null == n ? 0 : +n, o.restart((e => {
            o.stop(), t(e + n)
        }), n, e), o
    }, t.timer = p, t.timerFlush = w, Object.defineProperty(t, "__esModule", {
        value: !0
    })
}));
