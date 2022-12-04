// https://d3js.org/d3-timer/ v3.0.1 Copyright 2010-2021 Mike Bostock
! function(n, t) {
    "object" == typeof exports && "undefined" != typeof module ? t(exports, require("d3-quadtree"), require("d3-dispatch"), require("d3-timer")) : "function" == typeof define && define.amd ? define(["exports", "d3-quadtree", "d3-dispatch", "d3-timer"], t) : t((n = "undefined" != typeof globalThis ? globalThis : n || self).d3 = n.d3 || {}, n.d3, n.d3, n.d3)
}(this, (function(n, t, e, r) {
    "use strict";

    function i(n) {
        return function() {
            return n
        }
    }

    function u(n) {
        return 1e-6 * (n() - .5)
    }

    function o(n) {
        return n.x + n.vx
    }

    function f(n) {
        return n.y + n.vy
    }

    function a(n) {
        return n.index
    }

    function c(n, t) {
        var e = n.get(t);
        if (!e) throw new Error("node not found: " + t);
        return e
    }
    const l = 4294967296;

    function h(n) {
        return n.x
    }

    function v(n) {
        return n.y
    }
    var y = Math.PI * (3 - Math.sqrt(5));
    n.forceCenter = function(n, t) {
        var e, r = 1;

        function i() {
            var i, u, o = e.length,
                f = 0,
                a = 0;
            for (i = 0; i < o; ++i) f += (u = e[i]).x, a += u.y;
            for (f = (f / o - n) * r, a = (a / o - t) * r, i = 0; i < o; ++i)(u = e[i]).x -= f, u.y -= a
        }
        return null == n && (n = 0), null == t && (t = 0), i.initialize = function(n) {
            e = n
        }, i.x = function(t) {
            return arguments.length ? (n = +t, i) : n
        }, i.y = function(n) {
            return arguments.length ? (t = +n, i) : t
        }, i.strength = function(n) {
            return arguments.length ? (r = +n, i) : r
        }, i
    }, n.forceCollide = function(n) {
        var e, r, a, c = 1,
            l = 1;

        function h() {
            for (var n, i, h, y, d, g, x, xx, s = e.length, p = 0; p < l; ++p){
                for (i = t.quadtree(e, o, f).visitAfter(v), n = 0; n < s; ++n){
                    h = e[n];
                    x = r[h.index].x * r[h.index].x + r[h.index].y * r[h.index].y;
                    xx = r[h.index];
                    g = Math.sqrt(x);
                    y = h.x + h.vx;
                    d = h.y + h.vy;
                    i.visit(M);
                }
            }

            function M(n, t, e, r, i) {
                var o = n.data,
                    f = Math.sqrt(n.r.x * n.r.x + n.r.y * n.r.y),
                    l = g + f,
                    xxd = {x: n.r.x + xx.x, y: n.r.y + xx.y};
                if (!o) return t > y + l || r < y - l || e > d + l || i < d - l;
                if (o.index > h.index) {
                    let _x1 = y;
                    let _y1 = d;
                    let _x2 = o.x + o.vx;
                    let _y2 = o.y + o.vy;
                    let _w1 = xx.x * 1.42;
                    let _h1 = xx.y * 1.42;
                    let _w2 = n.r.x * 1.42;
                    let _h2 = n.r.y * 1.42;
            
                    let _b1 = _h1 * _w1 / Math.sqrt( (_x2 - _x1) * (_x2 - _x1) * _h1 * _h1 + (_y2 - _y1) * (_y2 - _y1) * _w1 * _w1)
                    let _b2 = _h2 * _w2 / Math.sqrt( (_x2 - _x1) * (_x2 - _x1) * _h2 * _h2 + (_y2 - _y1) * (_y2 - _y1) * _w2 * _w2)

                    let _x1_d = _b1 * (_x2 - _x1);
                    let _x2_d = _b2 * (_x1 - _x2);
                    let _y1_d = _b1 * (_y2 - _y1);
                    let _y2_d = _b2 * (_y1 - _y2);

                    
                    var v = y - o.x - o.vx,
                        s = d - o.y - o.vy;

                    let _l = Math.sqrt( (_x2-_x1)*(_x2-_x1) + (_y2-_y1)*(_y2-_y1) );
                    let _r1 = Math.sqrt( _x1_d * _x1_d + _y1_d * _y1_d ) 
                    let _r2 = Math.sqrt( _x2_d * _x2_d + _y2_d * _y2_d )
                    let _r = _r1 + _r2;
                    if(_l < _r)
                    {
                        _l = _l * _l;
                        if(v === 0) { v = 1e-6 * (a() - 0.5); _l += v * v; }
                        if(s === 0) { s = 1e-6 * (a() - 0.5); _l += s * s; }
                        _l = Math.sqrt(_l)
                        _l = (_r - _l) / _l * c; 
    
                        let _rr = _r2 * _r2 / (_r1 * _r1 + _r2 * _r2);
                        h.vx += (v *= _l) * _rr;
                        h.vy += (s *= _l) * _rr;
                        o.vx -= v * (1-_rr);
                        o.vy -= s * (1-_rr);
                    }
                }
            }
        }

        function v(n) {
            if (n.data) return n.r = r[n.data.index];
            n.r = {x:0, y:0};
            for (var t = 0; t < 4; ++t) {
                n[t] && n[t].r.x > n.r.x && (n.r.x = n[t].r.x)
                n[t] && n[t].r.y > n.r.y && (n.r.y = n[t].r.y)
            }
        }

        function y() {
            if (e) {
                var t, i, u = e.length;
                for (r = new Array(u), t = 0; t < u; ++t) i = e[t], r[i.index] = n(i, t, e)
            }
        }
        return "function" != typeof n && (n = i(null == n ? 1 : +n)), h.initialize = function(n, t) {
            e = n, a = t, y()
        }, h.iterations = function(n) {
            return arguments.length ? (l = +n, h) : l
        }, h.strength = function(n) {
            return arguments.length ? (c = +n, h) : c
        }, h.radius = function(t) {
            return arguments.length ? (n = "function" == typeof t ? t : i(+t), y(), h) : n
        }, h
    }, n.forceLink = function(n) {
        var t, e, r, o, f, l, h = a,
            v = function(n) {
                return 1 / Math.min(o[n.source.index], o[n.target.index])
            },
            y = i(30),
            d = 1;

        function g(r) {
            for (var i = 0, o = n.length; i < d; ++i) {
                for (var a, c, h, v, y, g, x, s = 0; s < o; ++s){
                    c = (a = n[s]).source;
                    v = (h = a.target).x + h.vx - c.x - c.vx || u(l)
                    y = h.y + h.vy - c.y - c.vy || u(l)
                    g = Math.sqrt(v * v + y * y)
                    g = (g - e[s]) / g * r * t[s]
                    v *= g
                    y *= g
                    h.vx -= v * (x = f[s])
                    h.vy -= y * x
                    c.vx += v * (x = 1 - x)
                    c.vy += y * x
                }
            }
        }

        function x() {
            if (r) {
                var i, u, a = r.length,
                    l = n.length,
                    v = new Map(r.map(((n, t) => [h(n, t, r), n])));
                for (i = 0, o = new Array(a); i < l; ++i)(u = n[i]).index = i, "object" != typeof u.source && (u.source = c(v, u.source)), "object" != typeof u.target && (u.target = c(v, u.target)), o[u.source.index] = (o[u.source.index] || 0) + 1, o[u.target.index] = (o[u.target.index] || 0) + 1;
                for (i = 0, f = new Array(l); i < l; ++i) u = n[i], f[i] = o[u.source.index] / (o[u.source.index] + o[u.target.index]);
                t = new Array(l), s(), e = new Array(l), p()
            }
        }

        function s() {
            if (r)
                for (var e = 0, i = n.length; e < i; ++e) t[e] = +v(n[e], e, n)
        }

        function p() {
            if (r)
                for (var t = 0, i = n.length; t < i; ++t) e[t] = +y(n[t], t, n)
        }
        return null == n && (n = []), g.initialize = function(n, t) {
            r = n, l = t, x()
        }, g.links = function(t) {
            return arguments.length ? (n = t, x(), g) : n
        }, g.id = function(n) {
            return arguments.length ? (h = n, g) : h
        }, g.iterations = function(n) {
            return arguments.length ? (d = +n, g) : d
        }, g.strength = function(n) {
            return arguments.length ? (v = "function" == typeof n ? n : i(+n), s(), g) : v
        }, g.distance = function(n) {
            return arguments.length ? (y = "function" == typeof n ? n : i(+n), p(), g) : y
        }, g
    }, n.forceManyBody = function() {
        var n, e, r, o, f, a = i(-30),
            c = 1,
            l = 1 / 0,
            y = .81;

        function d(r) {
            var i, u = n.length,
                f = t.quadtree(n, h, v).visitAfter(x);
            for (o = r, i = 0; i < u; ++i) e = n[i], f.visit(s)
        }

        function g() {
            if (n) {
                var t, e, r = n.length;
                for (f = new Array(r), t = 0; t < r; ++t) e = n[t], f[e.index] = +a(e, t, n)
            }
        }

        function x(n) {
            var t, e, r, i, u, o = 0,
                a = 0;
            if (n.length) {
                for (r = i = u = 0; u < 4; ++u)(t = n[u]) && (e = Math.abs(t.value)) && (o += t.value, a += e, r += e * t.x, i += e * t.y);
                n.x = r / a, n.y = i / a
            } else {
                (t = n).x = t.data.x, t.y = t.data.y;
                do {
                    o += f[t.data.index]
                } while (t = t.next)
            }
            n.value = o
        }

        function s(n, t, i, a) {
            if (!n.value) return !0;
            var h = n.x - e.x,
                v = n.y - e.y,
                d = a - t,
                g = h * h + v * v;
            if (d * d / y < g) return g < l && (0 === h && (g += (h = u(r)) * h), 0 === v && (g += (v = u(r)) * v), g < c && (g = Math.sqrt(c * g)), e.vx += h * n.value * o / g, e.vy += v * n.value * o / g), !0;
            if (!(n.length || g >= l)) {
                (n.data !== e || n.next) && (0 === h && (g += (h = u(r)) * h), 0 === v && (g += (v = u(r)) * v), g < c && (g = Math.sqrt(c * g)));
                do {
                    n.data !== e && (d = f[n.data.index] * o / g, e.vx += h * d, e.vy += v * d)
                } while (n = n.next)
            }
        }
        return d.initialize = function(t, e) {
            n = t, r = e, g()
        }, d.strength = function(n) {
            return arguments.length ? (a = "function" == typeof n ? n : i(+n), g(), d) : a
        }, d.distanceMin = function(n) {
            return arguments.length ? (c = n * n, d) : Math.sqrt(c)
        }, d.distanceMax = function(n) {
            return arguments.length ? (l = n * n, d) : Math.sqrt(l)
        }, d.theta = function(n) {
            return arguments.length ? (y = n * n, d) : Math.sqrt(y)
        }, d
    }, n.forceRadial = function(n, t, e) {
        var r, u, o, f = i(.1);

        function a(n) {
            for (var i = 0, f = r.length; i < f; ++i) {
                var a = r[i],
                    c = a.x - t || 1e-6,
                    l = a.y - e || 1e-6,
                    h = Math.sqrt(c * c + l * l),
                    v = (o[i] - h) * u[i] * n / h;
                a.vx += c * v, a.vy += l * v
            }
        }

        function c() {
            if (r) {
                var t, e = r.length;
                for (u = new Array(e), o = new Array(e), t = 0; t < e; ++t) o[t] = +n(r[t], t, r), u[t] = isNaN(o[t]) ? 0 : +f(r[t], t, r)
            }
        }
        return "function" != typeof n && (n = i(+n)), null == t && (t = 0), null == e && (e = 0), a.initialize = function(n) {
            r = n, c()
        }, a.strength = function(n) {
            return arguments.length ? (f = "function" == typeof n ? n : i(+n), c(), a) : f
        }, a.radius = function(t) {
            return arguments.length ? (n = "function" == typeof t ? t : i(+t), c(), a) : n
        }, a.x = function(n) {
            return arguments.length ? (t = +n, a) : t
        }, a.y = function(n) {
            return arguments.length ? (e = +n, a) : e
        }, a
    }, n.forceSimulation = function(n) {
        var t, i = 1,
            u = .001,
            o = 1 - Math.pow(u, 1 / 300),
            f = 0,
            a = .6,
            c = new Map,
            h = r.timer(g),
            v = e.dispatch("tick", "end"),
            d = function() {
                let n = 1;
                return () => (n = (1664525 * n + 1013904223) % l) / l
            }();

        function g() {
            x(), v.call("tick", t), i < u && (h.stop(), v.call("end", t))
        }

        function x(e) {
            var r, u, l = n.length;
            void 0 === e && (e = 1);
            for (var h = 0; h < e; ++h)
                for (i += (f - i) * o, c.forEach((function(n) {
                        n(i)
                    })), r = 0; r < l; ++r) null == (u = n[r]).fx ? u.x += u.vx *= a : (u.x = u.fx, u.vx = 0), null == u.fy ? u.y += u.vy *= a : (u.y = u.fy, u.vy = 0);
            return t
        }

        function s() {
            for (var t, e = 0, r = n.length; e < r; ++e) {
                if ((t = n[e]).index = e, null != t.fx && (t.x = t.fx), null != t.fy && (t.y = t.fy), isNaN(t.x) || isNaN(t.y)) {
                    var i = 10 * Math.sqrt(.5 + e),
                        u = e * y;
                    t.x = i * Math.cos(u), t.y = i * Math.sin(u)
                }(isNaN(t.vx) || isNaN(t.vy)) && (t.vx = t.vy = 0)
            }
        }

        function p(t) {
            return t.initialize && t.initialize(n, d), t
        }
        return null == n && (n = []), s(), t = {
            tick: x,
            restart: function() {
                return h.restart(g), t
            },
            stop: function() {
                return h.stop(), t
            },
            nodes: function(e) {
                return arguments.length ? (n = e, s(), c.forEach(p), t) : n
            },
            alpha: function(n) {
                return arguments.length ? (i = +n, t) : i
            },
            alphaMin: function(n) {
                return arguments.length ? (u = +n, t) : u
            },
            alphaDecay: function(n) {
                return arguments.length ? (o = +n, t) : +o
            },
            alphaTarget: function(n) {
                return arguments.length ? (f = +n, t) : f
            },
            velocityDecay: function(n) {
                return arguments.length ? (a = 1 - n, t) : 1 - a
            },
            randomSource: function(n) {
                return arguments.length ? (d = n, c.forEach(p), t) : d
            },
            force: function(n, e) {
                return arguments.length > 1 ? (null == e ? c.delete(n) : c.set(n, p(e)), t) : c.get(n)
            },
            find: function(t, e, r) {
                var i, u, o, f, a, c = 0,
                    l = n.length;
                for (null == r ? r = 1 / 0 : r *= r, c = 0; c < l; ++c)(o = (i = t - (f = n[c]).x) * i + (u = e - f.y) * u) < r && (a = f, r = o);
                return a
            },
            on: function(n, e) {
                return arguments.length > 1 ? (v.on(n, e), t) : v.on(n)
            }
        }
    }, n.forceX = function(n) {
        var t, e, r, u = i(.1);

        function o(n) {
            for (var i, u = 0, o = t.length; u < o; ++u)(i = t[u]).vx += (r[u] - i.x) * e[u] * n
        }

        function f() {
            if (t) {
                var i, o = t.length;
                for (e = new Array(o), r = new Array(o), i = 0; i < o; ++i) e[i] = isNaN(r[i] = +n(t[i], i, t)) ? 0 : +u(t[i], i, t)
            }
        }
        return "function" != typeof n && (n = i(null == n ? 0 : +n)), o.initialize = function(n) {
            t = n, f()
        }, o.strength = function(n) {
            return arguments.length ? (u = "function" == typeof n ? n : i(+n), f(), o) : u
        }, o.x = function(t) {
            return arguments.length ? (n = "function" == typeof t ? t : i(+t), f(), o) : n
        }, o
    }, n.forceY = function(n) {
        var t, e, r, u = i(.1);

        function o(n) {
            for (var i, u = 0, o = t.length; u < o; ++u)(i = t[u]).vy += (r[u] - i.y) * e[u] * n
        }

        function f() {
            if (t) {
                var i, o = t.length;
                for (e = new Array(o), r = new Array(o), i = 0; i < o; ++i) e[i] = isNaN(r[i] = +n(t[i], i, t)) ? 0 : +u(t[i], i, t)
            }
        }
        return "function" != typeof n && (n = i(null == n ? 0 : +n)), o.initialize = function(n) {
            t = n, f()
        }, o.strength = function(n) {
            return arguments.length ? (u = "function" == typeof n ? n : i(+n), f(), o) : u
        }, o.y = function(t) {
            return arguments.length ? (n = "function" == typeof t ? t : i(+t), f(), o) : n
        }, o
    }, Object.defineProperty(n, "__esModule", {
        value: !0
    })
}));
