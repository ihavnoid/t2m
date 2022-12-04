// https://d3js.org/d3-quadtree/ v3.0.1 Copyright 2010-2021 Mike Bostock
! function(t, i) {
    "object" == typeof exports && "undefined" != typeof module ? i(exports) : "function" == typeof define && define.amd ? define(["exports"], i) : i((t = "undefined" != typeof globalThis ? globalThis : t || self).d3 = t.d3 || {})
}(this, (function(t) {
    "use strict";

    function i(t, i, e, n) {
        if (isNaN(i) || isNaN(e)) return t;
        var r, s, h, o, a, u, l, _, f, c = t._root,
            x = {
                data: n
            },
            y = t._x0,
            d = t._y0,
            p = t._x1,
            v = t._y1;
        if (!c) return t._root = x, t;
        for (; c.length;)
            if ((u = i >= (s = (y + p) / 2)) ? y = s : p = s, (l = e >= (h = (d + v) / 2)) ? d = h : v = h, r = c, !(c = c[_ = l << 1 | u])) return r[_] = x, t;
        if (o = +t._x.call(null, c.data), a = +t._y.call(null, c.data), i === o && e === a) return x.next = c, r ? r[_] = x : t._root = x, t;
        do {
            r = r ? r[_] = new Array(4) : t._root = new Array(4), (u = i >= (s = (y + p) / 2)) ? y = s : p = s, (l = e >= (h = (d + v) / 2)) ? d = h : v = h
        } while ((_ = l << 1 | u) == (f = (a >= h) << 1 | o >= s));
        return r[f] = c, r[_] = x, t
    }

    function e(t, i, e, n, r) {
        this.node = t, this.x0 = i, this.y0 = e, this.x1 = n, this.y1 = r
    }

    function n(t) {
        return t[0]
    }

    function r(t) {
        return t[1]
    }

    function s(t, i, e) {
        var s = new h(null == i ? n : i, null == e ? r : e, NaN, NaN, NaN, NaN);
        return null == t ? s : s.addAll(t)
    }

    function h(t, i, e, n, r, s) {
        this._x = t, this._y = i, this._x0 = e, this._y0 = n, this._x1 = r, this._y1 = s, this._root = void 0
    }

    function o(t) {
        for (var i = {
                data: t.data
            }, e = i; t = t.next;) e = e.next = {
            data: t.data
        };
        return i
    }
    var a = s.prototype = h.prototype;
    a.copy = function() {
        var t, i, e = new h(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
            n = this._root;
        if (!n) return e;
        if (!n.length) return e._root = o(n), e;
        for (t = [{
                source: n,
                target: e._root = new Array(4)
            }]; n = t.pop();)
            for (var r = 0; r < 4; ++r)(i = n.source[r]) && (i.length ? t.push({
                source: i,
                target: n.target[r] = new Array(4)
            }) : n.target[r] = o(i));
        return e
    }, a.add = function(t) {
        const e = +this._x.call(null, t),
            n = +this._y.call(null, t);
        return i(this.cover(e, n), e, n, t)
    }, a.addAll = function(t) {
        var e, n, r, s, h = t.length,
            o = new Array(h),
            a = new Array(h),
            u = 1 / 0,
            l = 1 / 0,
            _ = -1 / 0,
            f = -1 / 0;
        for (n = 0; n < h; ++n) isNaN(r = +this._x.call(null, e = t[n])) || isNaN(s = +this._y.call(null, e)) || (o[n] = r, a[n] = s, r < u && (u = r), r > _ && (_ = r), s < l && (l = s), s > f && (f = s));
        if (u > _ || l > f) return this;
        for (this.cover(u, l).cover(_, f), n = 0; n < h; ++n) i(this, o[n], a[n], t[n]);
        return this
    }, a.cover = function(t, i) {
        if (isNaN(t = +t) || isNaN(i = +i)) return this;
        var e = this._x0,
            n = this._y0,
            r = this._x1,
            s = this._y1;
        if (isNaN(e)) r = (e = Math.floor(t)) + 1, s = (n = Math.floor(i)) + 1;
        else {
            for (var h, o, a = r - e || 1, u = this._root; e > t || t >= r || n > i || i >= s;) switch (o = (i < n) << 1 | t < e, (h = new Array(4))[o] = u, u = h, a *= 2, o) {
                case 0:
                    r = e + a, s = n + a;
                    break;
                case 1:
                    e = r - a, s = n + a;
                    break;
                case 2:
                    r = e + a, n = s - a;
                    break;
                case 3:
                    e = r - a, n = s - a
            }
            this._root && this._root.length && (this._root = u)
        }
        return this._x0 = e, this._y0 = n, this._x1 = r, this._y1 = s, this
    }, a.data = function() {
        var t = [];
        return this.visit((function(i) {
            if (!i.length)
                do {
                    t.push(i.data)
                } while (i = i.next)
        })), t
    }, a.extent = function(t) {
        return arguments.length ? this.cover(+t[0][0], +t[0][1]).cover(+t[1][0], +t[1][1]) : isNaN(this._x0) ? void 0 : [
            [this._x0, this._y0],
            [this._x1, this._y1]
        ]
    }, a.find = function(t, i, n) {
        var r, s, h, o, a, u, l, _ = this._x0,
            f = this._y0,
            c = this._x1,
            x = this._y1,
            y = [],
            d = this._root;
        for (d && y.push(new e(d, _, f, c, x)), null == n ? n = 1 / 0 : (_ = t - n, f = i - n, c = t + n, x = i + n, n *= n); u = y.pop();)
            if (!(!(d = u.node) || (s = u.x0) > c || (h = u.y0) > x || (o = u.x1) < _ || (a = u.y1) < f))
                if (d.length) {
                    var p = (s + o) / 2,
                        v = (h + a) / 2;
                    y.push(new e(d[3], p, v, o, a), new e(d[2], s, v, p, a), new e(d[1], p, h, o, v), new e(d[0], s, h, p, v)), (l = (i >= v) << 1 | t >= p) && (u = y[y.length - 1], y[y.length - 1] = y[y.length - 1 - l], y[y.length - 1 - l] = u)
                } else {
                    var w = t - +this._x.call(null, d.data),
                        N = i - +this._y.call(null, d.data),
                        g = w * w + N * N;
                    if (g < n) {
                        var A = Math.sqrt(n = g);
                        _ = t - A, f = i - A, c = t + A, x = i + A, r = d.data
                    }
                } return r
    }, a.remove = function(t) {
        if (isNaN(s = +this._x.call(null, t)) || isNaN(h = +this._y.call(null, t))) return this;
        var i, e, n, r, s, h, o, a, u, l, _, f, c = this._root,
            x = this._x0,
            y = this._y0,
            d = this._x1,
            p = this._y1;
        if (!c) return this;
        if (c.length)
            for (;;) {
                if ((u = s >= (o = (x + d) / 2)) ? x = o : d = o, (l = h >= (a = (y + p) / 2)) ? y = a : p = a, i = c, !(c = c[_ = l << 1 | u])) return this;
                if (!c.length) break;
                (i[_ + 1 & 3] || i[_ + 2 & 3] || i[_ + 3 & 3]) && (e = i, f = _)
            }
        for (; c.data !== t;)
            if (n = c, !(c = c.next)) return this;
        return (r = c.next) && delete c.next, n ? (r ? n.next = r : delete n.next, this) : i ? (r ? i[_] = r : delete i[_], (c = i[0] || i[1] || i[2] || i[3]) && c === (i[3] || i[2] || i[1] || i[0]) && !c.length && (e ? e[f] = c : this._root = c), this) : (this._root = r, this)
    }, a.removeAll = function(t) {
        for (var i = 0, e = t.length; i < e; ++i) this.remove(t[i]);
        return this
    }, a.root = function() {
        return this._root
    }, a.size = function() {
        var t = 0;
        return this.visit((function(i) {
            if (!i.length)
                do {
                    ++t
                } while (i = i.next)
        })), t
    }, a.visit = function(t) {
        var i, n, r, s, h, o, a = [],
            u = this._root;
        for (u && a.push(new e(u, this._x0, this._y0, this._x1, this._y1)); i = a.pop();)
            if (!t(u = i.node, r = i.x0, s = i.y0, h = i.x1, o = i.y1) && u.length) {
                var l = (r + h) / 2,
                    _ = (s + o) / 2;
                (n = u[3]) && a.push(new e(n, l, _, h, o)), (n = u[2]) && a.push(new e(n, r, _, l, o)), (n = u[1]) && a.push(new e(n, l, s, h, _)), (n = u[0]) && a.push(new e(n, r, s, l, _))
            } return this
    }, a.visitAfter = function(t) {
        var i, n = [],
            r = [];
        for (this._root && n.push(new e(this._root, this._x0, this._y0, this._x1, this._y1)); i = n.pop();) {
            var s = i.node;
            if (s.length) {
                var h, o = i.x0,
                    a = i.y0,
                    u = i.x1,
                    l = i.y1,
                    _ = (o + u) / 2,
                    f = (a + l) / 2;
                (h = s[0]) && n.push(new e(h, o, a, _, f)), (h = s[1]) && n.push(new e(h, _, a, u, f)), (h = s[2]) && n.push(new e(h, o, f, _, l)), (h = s[3]) && n.push(new e(h, _, f, u, l))
            }
            r.push(i)
        }
        for (; i = r.pop();) t(i.node, i.x0, i.y0, i.x1, i.y1);
        return this
    }, a.x = function(t) {
        return arguments.length ? (this._x = t, this) : this._x
    }, a.y = function(t) {
        return arguments.length ? (this._y = t, this) : this._y
    }, t.quadtree = s, Object.defineProperty(t, "__esModule", {
        value: !0
    })
}));
