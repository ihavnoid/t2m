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

    function jiggle(n) {
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

        function force() {
            var i, u, o = e.length,
                f = 0,
                a = 0;
            for (i = 0; i < o; ++i) f += (u = e[i]).x, a += u.y;
            for (f = (f / o - n) * r, a = (a / o - t) * r, i = 0; i < o; ++i)(u = e[i]).x -= f, u.y -= a
        }
        return null == n && (n = 0), null == t && (t = 0), force.initialize = function(n) {
            e = n
        }, force.x = function(t) {
            return arguments.length ? (n = +t, force) : n
        }, force.y = function(n) {
            return arguments.length ? (t = +n, force) : t
        }, force.strength = function(n) {
            return arguments.length ? (r = +n, force) : r
        }, force
    }, n.forceCollide = function(radius_value) {
        var nodes, radii, a, c = 1,
            l = 1;

        function force() {
            for(let iter = 0; iter < l; iter++) {
                for (let i=0; i<nodes.length; i++) {
                    for(let j = 0; j < nodes.length; j++) {
                        let n1 = nodes[i];
                        let n2 = nodes[j];
                        apply_force(n1, n2);
                    }
                }
            }

            function apply_force(n1, n2) {
                let xx = radii[n1.index];
                let xx2 = radii[n2.index];
                let dist = 10;
                if(n1.distance_map.has(n2.id)) {
                    dist = n1.distance_map.get(n2.id);
                }
                dist = Math.min(dist, 5);
                if(dist == 2 && n1.data.level == n2.data.level) {
                    dist = 0;
                } 
                if(n1.fx && n1.fy && n2.fx && n2.fy) {
                    return;
                }
                if (n1.index > n2.index) {
                    let _x1 = n1.x + n1.vx;
                    let _y1 = n1.y + n1.vy;
                    let _x2 = n2.x + n2.vx;
                    let _y2 = n2.y + n2.vy;

                    let _w1 = xx.x * 1.42;
                    let _h1 = xx.y * 1.42;
                    let _w2 = xx2.x * 1.42;
                    let _h2 = xx2.y * 1.42;
                    if(!n2.children_set.has(n1)) {
                        if(n2.children_set.size > 1) {
                            _w2 = Math.max(Math.sqrt(n2.area)/1.4, _w2);
                            _h2 = Math.max(Math.sqrt(n2.area)/1.4, _h2);

                            let p = n2.data.parent;
                            if(p) {
                                let _px = p.x + p.vx;
                                let _py = p.y + p.vx;
                                let _dx = _px - _x2;
                                let _dy = _py - _y2;
                                let _ll = Math.sqrt(_dx *_dx + _dy * _dy) || jiggle(l);
                                _dx *= (_w2 - xx2.x * 1.42) / _ll * 0.7;
                                _dy *= (_h2 - xx2.y * 1.42) / _ll * 0.7;
                                _x2 -= _dx;
                                _y2 -= _dy;
                            }
                        }
                    }
                    if(!n1.children_set.has(n2)) {
                        if(n1.children_set.size > 1) {
                            _w1 = Math.max(Math.sqrt(n1.area)/1,4, _w1);
                            _h1 = Math.max(Math.sqrt(n1.area)/1.4, _h1);
                            let p = n1.data.parent;
                            if(p) {
                                let _px = p.x + p.vx;
                                let _py = p.y + p.vx;
                                let _dx = _px - _x1;
                                let _dy = _py - _y1;
                                let _ll = Math.sqrt(_dx *_dx + _dy * _dy) || jiggle(l);
                                _dx *= (_w1 - xx.x * 1.42) / _ll * 0.7;
                                _dy *= (_h1 - xx.y * 1.42) / _ll * 0.7;
                                _x1 -= _dx;
                                _y1 -= _dy;
                            }
                        }
                    }           
                    if(dist > 1) {
                        _w1 += 10 * (dist-1);
                        _w2 += 10 * (dist-1);
                        _h1 += 10 * (dist-1);
                        _h2 += 10 * (dist-1);
                    }
                    let _b1 = _h1 * _w1 / Math.sqrt( (_x2 - _x1) * (_x2 - _x1) * _h1 * _h1 + (_y2 - _y1) * (_y2 - _y1) * _w1 * _w1)
                    let _b2 = _h2 * _w2 / Math.sqrt( (_x2 - _x1) * (_x2 - _x1) * _h2 * _h2 + (_y2 - _y1) * (_y2 - _y1) * _w2 * _w2)

                    let _x1_d = _b1 * (_x2 - _x1);
                    let _x2_d = _b2 * (_x1 - _x2);
                    let _y1_d = _b1 * (_y2 - _y1);
                    let _y2_d = _b2 * (_y1 - _y2);

                    
                    var v = _x1 - _x2,
                        s = _y1 - _y2;

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
    
                        let _rr = n2.area / (n1.area + n2.area);
                        n1.vx += (v *= _l) * _rr;
                        n1.vy += (s *= _l) * _rr;
                        n2.vx -= v * (1-_rr);
                        n2.vy -= s * (1-_rr);
                    }
                }
            }
        }

        function y() {
            if (nodes) {
                var t, i, u = nodes.length;
                for (radii = new Array(u), t = 0; t < u; ++t) i = nodes[t], radii[i.index] = radius_value(i, t, nodes)
            }
        }
        return "function" != typeof radius_value && (radius_value = i(null == radius_value ? 1 : +radius_value)), force.initialize = function(n, t) {
            nodes = n, a = t, y()
        }, force.iterations = function(n) {
            return arguments.length ? (l = +n, force) : l
        }, force.strength = function(n) {
            return arguments.length ? (c = +n, force) : c
        }, force.radius = function(t) {
            return arguments.length ? (radius_value = "function" == typeof t ? t : i(+t), y(), force) : radius_value
        }, force
    }, n.forceLink = function(n) {
        var t, e, r, count, bias, l, h = a,
            v = function(n) {
                return 1 / Math.min(count[n.source.index], count[n.target.index])
            },
            y = i(30),
            d = 1;

        function force(alpha) {
            for (let i = 0; i < d; ++i) {
                for (let s = 0; s < n.length; ++s){
                    let a = n[s];
                    let src = a.source;
                    let tgt = a.target;
                    let p = tgt.data.parent;
                    let x = tgt.x + tgt.vx - src.x - src.vx || jiggle(l);
                    let y = tgt.y + tgt.vy - src.y - src.vy || jiggle(l);
                    let g = Math.sqrt(x * x + y * y);
                    let vvx = 0;
                    let vvy = 0;
                    if(p) {
                        let px = p.x + p.vx;
                        let py = p.y + p.vy;
                        let tvx = tgt.x + tgt.vx - px || jiggle(l);
                        let tvy = tgt.y + tgt.vy - py || jiggle(l);
                        let ll = Math.sqrt(tvx * tvx + tvy * tvy);
                        tvx /= ll;
                        tvy /= ll;
                        let cvx = x / g;
                        let cvy = y / g;
                        let vv = (1 - (tvx * cvx + tvy * cvy)) / 2;
                        vvx = tvx * vv;
                        vvy = tvy * vv;
                    }
                    let bx1 = src.w/2;
                    let by1 = bx1 * y / (x + 1e-6);
                    let by2 = src.h/2;
                    let bx2 = by2 * x / (y + 1e-6);
                    let bx3 = tgt.w/2;
                    let by3 = bx3 * y / (x + 1e-6);
                    let by4 = tgt.h/2;
                    let bx4 = by4 * x / (y + 1e-6);
                    g -= Math.sqrt(Math.min(bx1 * bx1 + by1 * by1, bx2 * bx2 + by2 * by2));
                    g -= Math.sqrt(Math.min(bx3 * bx3 + by3 * by3, bx4 * bx4 + by4 * by4));
                    if(g < 0.5 * e[s]) g = 0.5 * e[s];
                    g = (g - e[s]) / g * alpha * t[s];
                    x *= g;
                    y *= g;
                    let v = bias[s];
                    tgt.vx -= x * v;
                    tgt.vy -= y * v;
                    v = 1 - v;
                    src.vx += x * v;
                    src.vy += y * v;

                    src.vx += vvx * t[s] * alpha * 20;
                    src.vy += vvy * t[s] * alpha * 20;
                }
            }
            // Note : in our context, "PARENT" is always the target. "LEAF" is always the source.
            function links_intersect(link1, link2) {
                if(link1.source == link2.source || link1.target == link2.target || link1.source == link2.target || link1.target == link2.source) return false;
                function intersect_eq(x, y, link) {
                    let x1 = link.source.x;
                    let y1 = link.source.y;
                    let x2 = link.target.x;
                    let y2 = link.target.y;
                    return (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - x1 * y2;
                }
                let v1 = intersect_eq(link1.source.x, link1.source.y, link2) * intersect_eq(link1.target.x, link1.target.y, link2) < 0;
                let v2 = intersect_eq(link2.source.x, link2.source.y, link1) * intersect_eq(link2.target.x, link2.target.y, link1) < 0;
                return v1 && v2;
            }

            for(let i=0; i<n.length; ++i) {
                for(let j=i+1; j<n.length; ++j) {
                    if(n[i].source == n[j].source || 
                            n[i].source == n[j].target || 
                            n[i].target == n[j].source || 
                            n[i].target == n[j].target)
                    {
                        continue;
                    }

                    if(links_intersect(n[i], n[j])) {
                        if(!n[i].source.fixed) {
                            let vx = n[i].target.y - n[i].source.y
                            let vy = n[i].source.x - n[i].target.x
                            let ox = n[j].source.x - n[i].source.x
                            let oy = n[j].source.y - n[i].source.y
                            if(vx*vy + ox*oy < 0) {
                                vx = -vx; vy = -vy;
                            }
                            let l = Math.sqrt(vx*vx + vy * vy)
                            vx = vx / l * alpha * 100;
                            vy = vy / l * alpha * 100;
                            n[i].source.vx += vx;
                            n[i].source.vy += vy;
                        }
                        if(!n[j].source.fixed) {
                            let vx = n[j].target.y - n[j].source.y
                            let vy = n[j].source.x - n[j].target.x
                            let ox = n[i].source.x - n[j].source.x
                            let oy = n[i].source.y - n[j].source.y
                            if(vx*vy + ox*oy < 0) {
                                vx = -vx; vy = -vy;
                            }
                            let l = Math.sqrt(vx*vx + vy * vy)
                            vx = vx / l * alpha * 100;
                            vy = vy / l * alpha * 100;
                            n[j].source.vx += vx;
                            n[j].source.vy += vy;
                        }
                    }
                }
            }
        }

        function x() {
            if (r) {
                var i, u, a = r.length,
                    l = n.length,
                    v = new Map(r.map(((n, t) => [h(n, t, r), n])));
                for (i = 0, count = new Array(a); i < l; ++i)(u = n[i]).index = i, "object" != typeof u.source && (u.source = c(v, u.source)), "object" != typeof u.target && (u.target = c(v, u.target)), count[u.source.index] = (count[u.source.index] || 0) + 1, count[u.target.index] = (count[u.target.index] || 0) + 1;
                for (i = 0, bias = new Array(l); i < l; ++i) u = n[i], bias[i] = count[u.source.index] / (count[u.source.index] + count[u.target.index]);
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
        return null == n && (n = []), force.initialize = function(n, t) {
            r = n, l = t, x()
        }, force.links = function(t) {
            return arguments.length ? (n = t, x(), force) : n
        }, force.id = function(n) {
            return arguments.length ? (h = n, force) : h
        }, force.iterations = function(n) {
            return arguments.length ? (d = +n, force) : d
        }, force.strength = function(n) {
            return arguments.length ? (v = "function" == typeof n ? n : i(+n), s(), force) : v
        }, force.distance = function(n) {
            return arguments.length ? (y = "function" == typeof n ? n : i(+n), p(), force) : y
        }, force
    }, n.forceManyBody = function() {
        var n, e, r, o, f, strengthVal = i(-30),
            distanceMinVal = 1,
            distanceMaxVal = 1 / 0,
            thetaVal = .81;

        function d(r) {
            var i, u = n.length,
                f = t.quadtree(n, h, v).visitAfter(accumulate);
            for (o = r, i = 0; i < u; ++i) e = n[i], f.visit(apply)
        }

        function g() {
            if (n) {
                var t, e, r = n.length;
                for (f = new Array(r), t = 0; t < r; ++t) e = n[t], f[e.index] = +strengthVal(e, t, n)
            }
        }

        function accumulate(quad) {
            var t, e, r, i, u, o = 0, a = 0;
            if (quad.length) {
                for (r = i = u = 0; u < 4; ++u)(t = quad[u]) && (e = Math.abs(t.value)) && (o += t.value, a += e, r += e * t.x, i += e * t.y);
                quad.x = r / a, quad.y = i / a
            } else {
                (t = quad).x = t.data.x, t.y = t.data.y;
                do {
                    o += f[t.data.index]
                } while (t = t.next)
            }
            quad.value = o
        }

        function apply(n, t, i, a) {
            if (!n.value) return true;
            var h = n.x - e.x,
                v = n.y - e.y,
                d = a - t,
                g = h * h + v * v;
            if (d * d / thetaVal < g) return g < distanceMaxVal && (0 === h && (g += (h = jiggle(r)) * h), 0 === v && (g += (v = jiggle(r)) * v), g < distanceMinVal && (g = Math.sqrt(distanceMinVal * g)), e.vx += h * n.value * o / g, e.vy += v * n.value * o / g), !0;
            if (!(n.length || g >= distanceMaxVal)) {
                (n.data !== e || n.next) && (0 === h && (g += (h = jiggle(r)) * h), 0 === v && (g += (v = jiggle(r)) * v), g < distanceMinVal && (g = Math.sqrt(distanceMinVal * g)));
                do {
                    n.data !== e && (d = f[n.data.index] * o / g, e.vx += h * d, e.vy += v * d)
                } while (n = n.next)
            }
        }
        return d.initialize = function(t, e) {
            n = t, r = e, g()
        }, d.strength = function(n) {
            return arguments.length ? (strengthVal = "function" == typeof n ? n : i(+n), g(), d) : strengthVal
        }, d.distanceMin = function(n) {
            return arguments.length ? (distanceMinVal = n * n, d) : Math.sqrt(distanceMinVal)
        }, d.distanceMax = function(n) {
            return arguments.length ? (distanceMaxVal = n * n, d) : Math.sqrt(distanceMaxVal)
        }, d.theta = function(n) {
            return arguments.length ? (thetaVal = n * n, d) : Math.sqrt(thetaVal)
        }, d
    }, n.forceRadial = function(radiusVal, t, e) {
        var r, u, o, strengthVal = i(.1);

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
                for (u = new Array(e), o = new Array(e), t = 0; t < e; ++t) o[t] = +radiusVal(r[t], t, r), u[t] = isNaN(o[t]) ? 0 : +strengthVal(r[t], t, r)
            }
        }
        return "function" != typeof radiusVal && (radiusVal = i(+radiusVal)), null == t && (t = 0), null == e && (e = 0), a.initialize = function(n) {
            r = n, c()
        }, a.strength = function(n) {
            return arguments.length ? (strengthVal = "function" == typeof n ? n : i(+n), c(), a) : strengthVal
        }, a.radius = function(t) {
            return arguments.length ? (radiusVal = "function" == typeof t ? t : i(+t), c(), a) : radiusVal
        }, a.x = function(n) {
            return arguments.length ? (t = +n, a) : t
        }, a.y = function(n) {
            return arguments.length ? (e = +n, a) : e
        }, a
    }, n.forceSimulation = function(n) {
        var t, _alpha = 1,
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
            x(), v.call("tick", t), _alpha < u && (h.stop(), v.call("end", t))
        }

        function x(e) {
            var r, u, l = n.length;
            void 0 === e && (e = 1);
            for (var h = 0; h < e; ++h)
                for (_alpha += (f - _alpha) * o, c.forEach((function(n) {
                        n(_alpha)
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
                return arguments.length ? (_alpha = +n, t) : _alpha
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
