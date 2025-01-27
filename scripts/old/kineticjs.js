/**
 * KineticJS JavaScript Framework v4.3.3
 * http://www.kineticjs.com/
 * Copyright 2013, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: Feb 12 2013
 *
 * Copyright (C) 2011 - 2013 by Eric Rowell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * @namespace
 */
var Kinetic = {};
(function() {
    Kinetic.version = "4.3.3", Kinetic.Filters = {}, Kinetic.Plugins = {}, Kinetic.Global = {
        stages: [],
        idCounter: 0,
        ids: {},
        names: {},
        shapes: {},
        warn: function(a) {
            window.console && console.warn && console.warn("Kinetic warning: " + a)
        },
        extend: function(a, b) {
            for (var c in b.prototype) c in a.prototype || (a.prototype[c] = b.prototype[c])
        },
        _addId: function(a, b) {
            b !== undefined && (this.ids[b] = a)
        },
        _removeId: function(a) {
            a !== undefined && delete this.ids[a]
        },
        _addName: function(a, b) {
            b !== undefined && (this.names[b] === undefined && (this.names[b] = []), this.names[b].push(a))
        },
        _removeName: function(a, b) {
            if (a !== undefined) {
                var c = this.names[a];
                if (c !== undefined) {
                    for (var d = 0; d < c.length; d++) {
                        var e = c[d];
                        e._id === b && c.splice(d, 1)
                    }
                    c.length === 0 && delete this.names[a]
                }
            }
        }
    }
})(),
function(a, b) {
    typeof exports == "object" ? module.exports = b() : typeof define == "function" && define.amd ? define(b) : a.returnExports = b()
}(this, function() {
    return Kinetic
});
(function() {
    Kinetic.Type = {
        _isElement: function(a) {
            return !!a && a.nodeType == 1
        },
        _isFunction: function(a) {
            return !!(a && a.constructor && a.call && a.apply)
        },
        _isObject: function(a) {
            return !!a && a.constructor == Object
        },
        _isArray: function(a) {
            return Object.prototype.toString.call(a) == "[object Array]"
        },
        _isNumber: function(a) {
            return Object.prototype.toString.call(a) == "[object Number]"
        },
        _isString: function(a) {
            return Object.prototype.toString.call(a) == "[object String]"
        },
        _hasMethods: function(a) {
            var b = [];
            for (var c in a) this._isFunction(a[c]) && b.push(c);
            return b.length > 0
        },
        _isInDocument: function(a) {
            while (a = a.parentNode)
                if (a == document) return !0;
            return !1
        },
        _getXY: function(a) {
            if (this._isNumber(a)) return {
                x: a,
                y: a
            };
            if (this._isArray(a)) {
                if (a.length === 1) {
                    var b = a[0];
                    if (this._isNumber(b)) return {
                        x: b,
                        y: b
                    };
                    if (this._isArray(b)) return {
                        x: b[0],
                        y: b[1]
                    };
                    if (this._isObject(b)) return b
                } else if (a.length >= 2) return {
                    x: a[0],
                    y: a[1]
                }
            } else if (this._isObject(a)) return a;
            return null
        },
        _getSize: function(a) {
            if (this._isNumber(a)) return {
                width: a,
                height: a
            };
            if (this._isArray(a))
                if (a.length === 1) {
                    var b = a[0];
                    if (this._isNumber(b)) return {
                        width: b,
                        height: b
                    };
                    if (this._isArray(b)) {
                        if (b.length >= 4) return {
                            width: b[2],
                            height: b[3]
                        };
                        if (b.length >= 2) return {
                            width: b[0],
                            height: b[1]
                        }
                    } else if (this._isObject(b)) return b
                } else {
                    if (a.length >= 4) return {
                        width: a[2],
                        height: a[3]
                    };
                    if (a.length >= 2) return {
                        width: a[0],
                        height: a[1]
                    }
                }
            else if (this._isObject(a)) return a;
            return null
        },
        _getPoints: function(a) {
            if (a === undefined) return [];
            if (this._isArray(a[0])) {
                var b = [];
                for (var c = 0; c < a.length; c++) b.push({
                    x: a[c][0],
                    y: a[c][1]
                });
                return b
            }
            if (this._isObject(a[0])) return a;
            var b = [];
            for (var c = 0; c < a.length; c += 2) b.push({
                x: a[c],
                y: a[c + 1]
            });
            return b
        },
        _getImage: function(a, b) {
            if (!a) b(null);
            else if (this._isElement(a)) b(a);
            else if (this._isString(a)) {
                var c = new Image;
                c.onload = function() {
                    b(c)
                }, c.src = a
            } else if (a.data) {
                var d = document.createElement("canvas");
                d.width = a.width, d.height = a.height;
                var e = d.getContext("2d", {
                    willReadFrequently: true
                });
                e.putImageData(a, 0, 0);
                var f = d.toDataURL(),
                    c = new Image;
                c.onload = function() {
                    b(c)
                }, c.src = f
            } else b(null)
        },
        _rgbToHex: function(a, b, c) {
            return ((1 << 24) + (a << 16) + (b << 8) + c).toString(16).slice(1)
        },
        _hexToRgb: function(a) {
            var b = parseInt(a, 16);
            return {
                r: b >> 16 & 255,
                g: b >> 8 & 255,
                b: b & 255
            }
        },
        _getRandomColorKey: function() {
            var a = Math.round(Math.random() * 255),
                b = Math.round(Math.random() * 255),
                c = Math.round(Math.random() * 255);
            return this._rgbToHex(a, b, c)
        },
        _merge: function(a, b) {
            var c = this._clone(b);
            for (var d in a) this._isObject(a[d]) ? c[d] = this._merge(a[d], c[d]) : c[d] = a[d];
            return c
        },
        _clone: function(a) {
            var b = {};
            for (var c in a) this._isObject(a[c]) ? b[c] = this._clone(a[c]) : b[c] = a[c];
            return b
        },
        _degToRad: function(a) {
            return a * Math.PI / 180
        },
        _radToDeg: function(a) {
            return a * 180 / Math.PI
        }
    }
})();
(function() {
    var a = document.createElement("canvas"),
        b = a.getContext("2d", {
            willReadFrequently: true
        }),
        c = window.devicePixelRatio || 1,
        d = b.webkitBackingStorePixelRatio || b.mozBackingStorePixelRatio || b.msBackingStorePixelRatio || b.oBackingStorePixelRatio || b.backingStorePixelRatio || 1,
        e = c / d;
    Kinetic.Canvas = function(a, b, c) {
        this.pixelRatio = c || e, this.width = a, this.height = b, this.element = document.createElement("canvas"), this.context = this.element.getContext("2d", {
            willReadFrequently: true
        }), this.setSize(a || 0, b || 0)
    }, Kinetic.Canvas.prototype = {
        clear: function() {
            var a = this.getContext(),
                b = this.getElement();
            a.clearRect(0, 0, b.width, b.height)
        },
        getElement: function() {
            return this.element
        },
        getContext: function() {
            return this.context
        },
        setWidth: function(a) {
            this.width = a, this.element.width = a * this.pixelRatio, this.element.style.width = a + "px"
        },
        setHeight: function(a) {
            this.height = a, this.element.height = a * this.pixelRatio, this.element.style.height = a + "px"
        },
        getWidth: function() {
            return this.width
        },
        getHeight: function() {
            return this.height
        },
        setSize: function(a, b) {
            this.setWidth(a), this.setHeight(b)
        },
        toDataURL: function(a, b) {
            try {
                return this.element.toDataURL(a, b)
            } catch (c) {
                try {
                    return this.element.toDataURL()
                } catch (c) {
                    return Kinetic.Global.warn("Unable to get data URL. " + c.message), ""
                }
            }
        },
        fill: function(a) {
            a.getFillEnabled() && this._fill(a)
        },
        stroke: function(a) {
            a.getStrokeEnabled() && this._stroke(a)
        },
        fillStroke: function(a) {
            var b = a.getFillEnabled();
            b && this._fill(a), a.getStrokeEnabled() && this._stroke(a, a.hasShadow() && a.hasFill() && b)
        },
        applyShadow: function(a, b) {
            var c = this.context;
            c.save(), this._applyShadow(a), b(), c.restore(), b()
        },
        _applyLineCap: function(a) {
            var b = a.getLineCap();
            b && (this.context.lineCap = b)
        },
        _applyOpacity: function(a) {
            var b = a.getAbsoluteOpacity();
            b !== 1 && (this.context.globalAlpha = b)
        },
        _applyLineJoin: function(a) {
            var b = a.getLineJoin();
            b && (this.context.lineJoin = b)
        },
        _applyAncestorTransforms: function(a) {
            var b = this.context;
            a._eachAncestorReverse(function(a) {
                var c = a.getTransform(),
                    d = c.getMatrix();
                b.transform(d[0], d[1], d[2], d[3], d[4], d[5])
            }, !0)
        }
    }, Kinetic.SceneCanvas = function(a, b, c) {
        Kinetic.Canvas.call(this, a, b, c)
    }, Kinetic.SceneCanvas.prototype = {
        setWidth: function(a) {
            var b = this.pixelRatio;
            Kinetic.Canvas.prototype.setWidth.call(this, a), this.context.scale(b, b)
        },
        setHeight: function(a) {
            var b = this.pixelRatio;
            Kinetic.Canvas.prototype.setHeight.call(this, a), this.context.scale(b, b)
        },
        _fillColor: function(a) {
            var b = this.context,
                c = a.getFill();
            b.fillStyle = c, a._fillFunc(b)
        },
        _fillPattern: function(a) {
            var b = this.context,
                c = a.getFillPatternImage(),
                d = a.getFillPatternX(),
                e = a.getFillPatternY(),
                f = a.getFillPatternScale(),
                g = a.getFillPatternRotation(),
                h = a.getFillPatternOffset(),
                i = a.getFillPatternRepeat();
            (d || e) && b.translate(d || 0, e || 0), g && b.rotate(g), f && b.scale(f.x, f.y), h && b.translate(-1 * h.x, -1 * h.y), b.fillStyle = b.createPattern(c, i || "repeat"), b.fill()
        },
        _fillLinearGradient: function(a) {
            var b = this.context,
                c = a.getFillLinearGradientStartPoint(),
                d = a.getFillLinearGradientEndPoint(),
                e = a.getFillLinearGradientColorStops(),
                f = b.createLinearGradient(c.x, c.y, d.x, d.y);
            for (var g = 0; g < e.length; g += 2) f.addColorStop(e[g], e[g + 1]);
            b.fillStyle = f, b.fill()
        },
        _fillRadialGradient: function(a) {
            var b = this.context,
                c = a.getFillRadialGradientStartPoint(),
                d = a.getFillRadialGradientEndPoint(),
                e = a.getFillRadialGradientStartRadius(),
                f = a.getFillRadialGradientEndRadius(),
                g = a.getFillRadialGradientColorStops(),
                h = b.createRadialGradient(c.x, c.y, e, d.x, d.y, f);
            for (var i = 0; i < g.length; i += 2) h.addColorStop(g[i], g[i + 1]);
            b.fillStyle = h, b.fill()
        },
        _fill: function(a, b) {
            var c = this.context,
                d = a.getFill(),
                e = a.getFillPatternImage(),
                f = a.getFillLinearGradientStartPoint(),
                g = a.getFillRadialGradientStartPoint(),
                h = a.getFillPriority();
            c.save(), !b && a.hasShadow() && this._applyShadow(a), d && h === "color" ? this._fillColor(a) : e && h === "pattern" ? this._fillPattern(a) : f && h === "linear-gradient" ? this._fillLinearGradient(a) : g && h === "radial-gradient" ? this._fillRadialGradient(a) : d ? this._fillColor(a) : e ? this._fillPattern(a) : f ? this._fillLinearGradient(a) : g && this._fillRadialGradient(a), c.restore(), !b && a.hasShadow() && this._fill(a, !0)
        },
        _stroke: function(a, b) {
            var c = this.context,
                d = a.getStroke(),
                e = a.getStrokeWidth(),
                f = a.getDashArray();
            if (d || e) c.save(), this._applyLineCap(a), f && a.getDashArrayEnabled() && (c.setLineDash ? c.setLineDash(f) : "mozDash" in c ? c.mozDash = f : "webkitLineDash" in c && (c.webkitLineDash = f)), !b && a.hasShadow() && this._applyShadow(a), c.lineWidth = e || 2, c.strokeStyle = d || "black", a._strokeFunc(c), c.restore(), !b && a.hasShadow() && this._stroke(a, !0)
        },
        _applyShadow: function(a) {
            var b = this.context;
            if (a.hasShadow() && a.getShadowEnabled()) {
                var c = a.getAbsoluteOpacity(),
                    d = a.getShadowColor() || "black",
                    e = a.getShadowBlur() || 5,
                    f = a.getShadowOffset() || {
                        x: 0,
                        y: 0
                    };
                a.getShadowOpacity() && (b.globalAlpha = a.getShadowOpacity() * c), b.shadowColor = d, b.shadowBlur = e, b.shadowOffsetX = f.x, b.shadowOffsetY = f.y
            }
        }
    }, Kinetic.Global.extend(Kinetic.SceneCanvas, Kinetic.Canvas), Kinetic.HitCanvas = function(a, b, c) {
        Kinetic.Canvas.call(this, a, b, c)
    }, Kinetic.HitCanvas.prototype = {
        _fill: function(a) {
            var b = this.context;
            b.save(), b.fillStyle = "#" + a.colorKey, a._fillFuncHit(b), b.restore()
        },
        _stroke: function(a) {
            var b = this.context,
                c = a.getStroke(),
                d = a.getStrokeWidth();
            if (c || d) this._applyLineCap(a), b.save(), b.lineWidth = d || 2, b.strokeStyle = "#" + a.colorKey, a._strokeFuncHit(b), b.restore()
        }
    }, Kinetic.Global.extend(Kinetic.HitCanvas, Kinetic.Canvas)
})();
(function() {
    Kinetic.Transform = function() {
        this.m = [1, 0, 0, 1, 0, 0]
    }, Kinetic.Transform.prototype = {
        translate: function(a, b) {
            this.m[4] += this.m[0] * a + this.m[2] * b, this.m[5] += this.m[1] * a + this.m[3] * b
        },
        scale: function(a, b) {
            this.m[0] *= a, this.m[1] *= a, this.m[2] *= b, this.m[3] *= b
        },
        rotate: function(a) {
            var b = Math.cos(a),
                c = Math.sin(a),
                d = this.m[0] * b + this.m[2] * c,
                e = this.m[1] * b + this.m[3] * c,
                f = this.m[0] * -c + this.m[2] * b,
                g = this.m[1] * -c + this.m[3] * b;
            this.m[0] = d, this.m[1] = e, this.m[2] = f, this.m[3] = g
        },
        getTranslation: function() {
            return {
                x: this.m[4],
                y: this.m[5]
            }
        },
        multiply: function(a) {
            var b = this.m[0] * a.m[0] + this.m[2] * a.m[1],
                c = this.m[1] * a.m[0] + this.m[3] * a.m[1],
                d = this.m[0] * a.m[2] + this.m[2] * a.m[3],
                e = this.m[1] * a.m[2] + this.m[3] * a.m[3],
                f = this.m[0] * a.m[4] + this.m[2] * a.m[5] + this.m[4],
                g = this.m[1] * a.m[4] + this.m[3] * a.m[5] + this.m[5];
            this.m[0] = b, this.m[1] = c, this.m[2] = d, this.m[3] = e, this.m[4] = f, this.m[5] = g
        },
        invert: function() {
            var a = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]),
                b = this.m[3] * a,
                c = -this.m[1] * a,
                d = -this.m[2] * a,
                e = this.m[0] * a,
                f = a * (this.m[2] * this.m[5] - this.m[3] * this.m[4]),
                g = a * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
            this.m[0] = b, this.m[1] = c, this.m[2] = d, this.m[3] = e, this.m[4] = f, this.m[5] = g
        },
        getMatrix: function() {
            return this.m
        }
    }
})();
(function() {
    Kinetic.Collection = function() {
        var a = [].slice.call(arguments),
            b = a.length,
            c = 0;
        this.length = b;
        for (; c < b; c++) this[c] = a[c];
        return this
    }, Kinetic.Collection.prototype = new Array, Kinetic.Collection.prototype.apply = function(a) {
        args = [].slice.call(arguments), args.shift();
        for (var b = 0; b < this.length; b++) Kinetic.Type._isFunction(this[b][a]) && this[b][a].apply(this[b], args)
    }, Kinetic.Collection.prototype.each = function(a) {
        for (var b = 0; b < this.length; b++) a.call(this[b], b, this[b])
    }
})();
(function() {
    Kinetic.Node = function(a) {
        this._nodeInit(a)
    }, Kinetic.Node.prototype = {
        _nodeInit: function(a) {
            this._id = Kinetic.Global.idCounter++, this.defaultNodeAttrs = {
                visible: !0,
                listening: !0,
                name: undefined,
                opacity: 1,
                x: 0,
                y: 0,
                scale: {
                    x: 1,
                    y: 1
                },
                rotation: 0,
                offset: {
                    x: 0,
                    y: 0
                },
                draggable: !1,
                dragOnTop: !0
            }, this.setDefaultAttrs(this.defaultNodeAttrs), this.eventListeners = {}, this.setAttrs(a)
        },
        on: function(a, b) {
            var c = a.split(" "),
                d = c.length;
            for (var e = 0; e < d; e++) {
                var f = c[e],
                    g = f,
                    h = g.split("."),
                    i = h[0],
                    j = h.length > 1 ? h[1] : "";
                this.eventListeners[i] || (this.eventListeners[i] = []), this.eventListeners[i].push({
                    name: j,
                    handler: b
                })
            }
        },
        off: function(a) {
            var b = a.split(" "),
                c = b.length;
            for (var d = 0; d < c; d++) {
                var e = b[d],
                    f = e,
                    g = f.split("."),
                    h = g[0];
                if (g.length > 1)
                    if (h) this.eventListeners[h] && this._off(h, g[1]);
                    else
                        for (var e in this.eventListeners) this._off(e, g[1]);
                else delete this.eventListeners[h]
            }
        },
        remove: function() {
            var a = this.getParent();
            a && a.children && (a.children.splice(this.index, 1), a._setChildrenIndices()), delete this.parent
        },
        destroy: function() {
            var a = this.getParent(),
                b = this.getStage(),
                c = Kinetic.DD,
                d = Kinetic.Global;
            while (this.children && this.children.length > 0) this.children[0].destroy();
            d._removeId(this.getId()), d._removeName(this.getName(), this._id), c && c.node && c.node._id === this._id && node._endDrag(), this.trans && this.trans.stop(), this.remove()
        },
        getAttrs: function() {
            return this.attrs
        },
        setDefaultAttrs: function(a) {
            this.attrs === undefined && (this.attrs = {});
            if (a)
                for (var b in a) this.attrs[b] === undefined && (this.attrs[b] = a[b])
        },
        setAttrs: function(a) {
            if (a)
                for (var b in a) {
                    var c = "set" + b.charAt(0).toUpperCase() + b.slice(1);
                    Kinetic.Type._isFunction(this[c]) ? this[c](a[b]) : this.setAttr(b, a[b])
                }
        },
        getVisible: function() {
            var a = this.attrs.visible,
                b = this.getParent();
            return a && b && !b.getVisible() ? !1 : a
        },
        getListening: function() {
            var a = this.attrs.listening,
                b = this.getParent();
            return a && b && !b.getListening() ? !1 : a
        },
        show: function() {
            this.setVisible(!0)
        },
        hide: function() {
            this.setVisible(!1)
        },
        getZIndex: function() {
            return this.index
        },
        getAbsoluteZIndex: function() {
            function e(b) {
                var f = [],
                    g = b.length;
                for (var h = 0; h < g; h++) {
                    var i = b[h];
                    d++, i.nodeType !== "Shape" && (f = f.concat(i.getChildren())), i._id === c._id && (h = g)
                }
                f.length > 0 && f[0].getLevel() <= a && e(f)
            }
            var a = this.getLevel(),
                b = this.getStage(),
                c = this,
                d = 0;
            return c.nodeType !== "Stage" && e(c.getStage().getChildren()), d
        },
        getLevel: function() {
            var a = 0,
                b = this.parent;
            while (b) a++, b = b.parent;
            return a
        },
        setPosition: function() {
            var a = Kinetic.Type._getXY([].slice.call(arguments));
            this.setAttr("x", a.x), this.setAttr("y", a.y)
        },
        getPosition: function() {
            var a = this.attrs;
            return {
                x: a.x,
                y: a.y
            }
        },
        getAbsolutePosition: function() {
            var a = this.getAbsoluteTransform(),
                b = this.getOffset();
            return a.translate(b.x, b.y), a.getTranslation()
        },
        setAbsolutePosition: function() {
            var a = Kinetic.Type._getXY([].slice.call(arguments)),
                b = this._clearTransform();
            this.attrs.x = b.x, this.attrs.y = b.y, delete b.x, delete b.y;
            var c = this.getAbsoluteTransform();
            c.invert(), c.translate(a.x, a.y), a = {
                x: this.attrs.x + c.getTranslation().x,
                y: this.attrs.y + c.getTranslation().y
            }, this.setPosition(a.x, a.y), this._setTransform(b)
        },
        move: function() {
            var a = Kinetic.Type._getXY([].slice.call(arguments)),
                b = this.getX(),
                c = this.getY();
            a.x !== undefined && (b += a.x), a.y !== undefined && (c += a.y), this.setPosition(b, c)
        },
        _eachAncestorReverse: function(a, b) {
            var c = [],
                d = this.getParent();
            b && c.unshift(this);
            while (d) c.unshift(d), d = d.parent;
            var e = c.length;
            for (var f = 0; f < e; f++) a(c[f])
        },
        rotate: function(a) {
            this.setRotation(this.getRotation() + a)
        },
        rotateDeg: function(a) {
            this.setRotation(this.getRotation() + Kinetic.Type._degToRad(a))
        },
        moveToTop: function() {
            var a = this.index;
            return this.parent.children.splice(a, 1), this.parent.children.push(this), this.parent._setChildrenIndices(), !0
        },
        moveUp: function() {
            var a = this.index,
                b = this.parent.getChildren().length;
            if (a < b - 1) return this.parent.children.splice(a, 1), this.parent.children.splice(a + 1, 0, this), this.parent._setChildrenIndices(), !0
        },
        moveDown: function() {
            var a = this.index;
            if (a > 0) return this.parent.children.splice(a, 1), this.parent.children.splice(a - 1, 0, this), this.parent._setChildrenIndices(), !0
        },
        moveToBottom: function() {
            var a = this.index;
            if (a > 0) return this.parent.children.splice(a, 1), this.parent.children.unshift(this), this.parent._setChildrenIndices(), !0
        },
        setZIndex: function(a) {
            var b = this.index;
            this.parent.children.splice(b, 1), this.parent.children.splice(a, 0, this), this.parent._setChildrenIndices()
        },
        getAbsoluteOpacity: function() {
            var a = this.getOpacity();
            return this.getParent() && (a *= this.getParent().getAbsoluteOpacity()), a
        },
        moveTo: function(a) {
            Kinetic.Node.prototype.remove.call(this), a.add(this)
        },
        toObject: function() {
            var a = Kinetic.Type,
                b = {},
                c = this.attrs;
            b.attrs = {};
            for (var d in c) {
                var e = c[d];
                !a._isFunction(e) && !a._isElement(e) && (!a._isObject(e) || !a._hasMethods(e)) && (b.attrs[d] = e)
            }
            return b.nodeType = this.nodeType, b.shapeType = this.shapeType, b
        },
        toJSON: function() {
            return JSON.stringify(this.toObject())
        },
        getParent: function() {
            return this.parent
        },
        getLayer: function() {
            return this.getParent().getLayer()
        },
        getStage: function() {
            return this.getParent() ? this.getParent().getStage() : undefined
        },
        simulate: function(a, b) {
            this._handleEvent(a, b || {})
        },
        fire: function(a, b) {
            this._executeHandlers(a, b || {})
        },
        getAbsoluteTransform: function() {
            var a = new Kinetic.Transform;
            return this._eachAncestorReverse(function(b) {
                var c = b.getTransform();
                a.multiply(c)
            }, !0), a
        },
        getTransform: function() {
            var a = new Kinetic.Transform,
                b = this.attrs,
                c = b.x,
                d = b.y,
                e = b.rotation,
                f = b.scale,
                g = f.x,
                h = f.y,
                i = b.offset,
                j = i.x,
                k = i.y;
            return (c !== 0 || d !== 0) && a.translate(c, d), e !== 0 && a.rotate(e), (g !== 1 || h !== 1) && a.scale(g, h), (j !== 0 || k !== 0) && a.translate(-1 * j, -1 * k), a
        },
        clone: function(a) {
            var b = this.shapeType || this.nodeType,
                c = new Kinetic[b](this.attrs);
            for (var d in this.eventListeners) {
                var e = this.eventListeners[d],
                    f = e.length;
                for (var g = 0; g < f; g++) {
                    var h = e[g];
                    h.name.indexOf("kinetic") < 0 && (c.eventListeners[d] || (c.eventListeners[d] = []), c.eventListeners[d].push(h))
                }
            }
            return c.setAttrs(a), c
        },
        toDataURL: function(a) {
            a = a || {};
            var b = a.mimeType || null,
                c = a.quality || null,
                d, e, f = a.x || 0,
                g = a.y || 0;
            return a.width && a.height ? d = new Kinetic.SceneCanvas(a.width, a.height, 1) : (d = this.getStage().bufferCanvas, d.clear()), e = d.getContext(), e.save(), (f || g) && e.translate(-1 * f, -1 * g), this.drawScene(d), e.restore(), d.toDataURL(b, c)
        },
        toImage: function(a) {
            Kinetic.Type._getImage(this.toDataURL(a), function(b) {
                a.callback(b)
            })
        },
        setSize: function() {
            var a = Kinetic.Type._getSize(Array.prototype.slice.call(arguments));
            this.setWidth(a.width), this.setHeight(a.height)
        },
        getSize: function() {
            return {
                width: this.getWidth(),
                height: this.getHeight()
            }
        },
        getWidth: function() {
            return this.attrs.width || 0
        },
        getHeight: function() {
            return this.attrs.height || 0
        },
        _get: function(a) {
            return this.nodeType === a ? [this] : []
        },
        _off: function(a, b) {
            for (var c = 0; c < this.eventListeners[a].length; c++)
                if (this.eventListeners[a][c].name === b) {
                    this.eventListeners[a].splice(c, 1);
                    if (this.eventListeners[a].length === 0) {
                        delete this.eventListeners[a];
                        break
                    }
                    c--
                }
        },
        _clearTransform: function() {
            var a = this.attrs,
                b = a.scale,
                c = a.offset,
                d = {
                    x: a.x,
                    y: a.y,
                    rotation: a.rotation,
                    scale: {
                        x: b.x,
                        y: b.y
                    },
                    offset: {
                        x: c.x,
                        y: c.y
                    }
                };
            return this.attrs.x = 0, this.attrs.y = 0, this.attrs.rotation = 0, this.attrs.scale = {
                x: 1,
                y: 1
            }, this.attrs.offset = {
                x: 0,
                y: 0
            }, d
        },
        _setTransform: function(a) {
            for (var b in a) this.attrs[b] = a[b]
        },
        _fireBeforeChangeEvent: function(a, b, c) {
            this._handleEvent("before" + a.toUpperCase() + "Change", {
                oldVal: b,
                newVal: c
            })
        },
        _fireChangeEvent: function(a, b, c) {
            this._handleEvent(a + "Change", {
                oldVal: b,
                newVal: c
            })
        },
        setId: function(a) {
            var b = this.getId(),
                c = this.getStage(),
                d = Kinetic.Global;
            d._removeId(b), d._addId(this, a), this.setAttr("id", a)
        },
        setName: function(a) {
            var b = this.getName(),
                c = this.getStage(),
                d = Kinetic.Global;
            d._removeName(b, this._id), d._addName(this, a), this.setAttr("name", a)
        },
        setAttr: function(a, b) {
            if (b !== undefined) {
                var c = this.attrs[a];
                this._fireBeforeChangeEvent(a, c, b), this.attrs[a] = b, this._fireChangeEvent(a, c, b)
            }
        },
        _handleEvent: function(a, b, c) {
            b && this.nodeType === "Shape" && (b.shape = this);
            var d = this.getStage(),
                e = this.eventListeners,
                f = !0;
            a === "mouseenter" && c && this._id === c._id ? f = !1 : a === "mouseleave" && c && this._id === c._id && (f = !1), f && (e[a] && this.fire(a, b), b && !b.cancelBubble && this.parent && (c && c.parent ? this._handleEvent.call(this.parent, a, b, c.parent) : this._handleEvent.call(this.parent, a, b)))
        },
        _executeHandlers: function(a, b) {
            var c = this.eventListeners[a],
                d = c.length;
            for (var e = 0; e < d; e++) c[e].handler.apply(this, [b])
        }
    }, Kinetic.Node.addSetters = function(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addSetter(constructor, d)
        }
    }, Kinetic.Node.addPointSetters = function(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addPointSetter(constructor, d)
        }
    }, Kinetic.Node.addRotationSetters = function(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addRotationSetter(constructor, d)
        }
    }, Kinetic.Node.addGetters = function(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addGetter(constructor, d)
        }
    }, Kinetic.Node.addRotationGetters = function(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addRotationGetter(constructor, d)
        }
    }, Kinetic.Node.addGettersSetters = function(constructor, a) {
        this.addSetters(constructor, a), this.addGetters(constructor, a)
    }, Kinetic.Node.addPointGettersSetters = function(constructor, a) {
        this.addPointSetters(constructor, a), this.addGetters(constructor, a)
    }, Kinetic.Node.addRotationGettersSetters = function(constructor, a) {
        this.addRotationSetters(constructor, a), this.addRotationGetters(constructor, a)
    }, Kinetic.Node._addSetter = function(constructor, a) {
        var b = this,
            c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function(b) {
            this.setAttr(a, b)
        }
    }, Kinetic.Node._addPointSetter = function(constructor, a) {
        var b = this,
            c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function() {
            var b = Kinetic.Type._getXY([].slice.call(arguments));
            b && b.x === undefined && (b.x = this.attrs[a].x), b && b.y === undefined && (b.y = this.attrs[a].y), this.setAttr(a, b)
        }
    }, Kinetic.Node._addRotationSetter = function(constructor, a) {
        var b = this,
            c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function(b) {
            this.setAttr(a, b)
        }, constructor.prototype[c + "Deg"] = function(b) {
            this.setAttr(a, Kinetic.Type._degToRad(b))
        }
    }, Kinetic.Node._addGetter = function(constructor, a) {
        var b = this,
            c = "get" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function(b) {
            return this.attrs[a]
        }
    }, Kinetic.Node._addRotationGetter = function(constructor, a) {
        var b = this,
            c = "get" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function() {
            return this.attrs[a]
        }, constructor.prototype[c + "Deg"] = function() {
            return Kinetic.Type._radToDeg(this.attrs[a])
        }
    }, Kinetic.Node.create = function(a, b) {
        return this._createNode(JSON.parse(a), b)
    }, Kinetic.Node._createNode = function(a, b) {
        var c;
        a.nodeType === "Shape" ? a.shapeType === undefined ? c = "Shape" : c = a.shapeType : c = a.nodeType, b && (a.attrs.container = b);
        var d = new Kinetic[c](a.attrs);
        if (a.children) {
            var e = a.children.length;
            for (var f = 0; f < e; f++) d.add(this._createNode(a.children[f]))
        }
        return d
    }, Kinetic.Node.addGettersSetters(Kinetic.Node, ["x", "y", "opacity"]), Kinetic.Node.addGetters(Kinetic.Node, ["name", "id"]), Kinetic.Node.addRotationGettersSetters(Kinetic.Node, ["rotation"]), Kinetic.Node.addPointGettersSetters(Kinetic.Node, ["scale", "offset"]), Kinetic.Node.addSetters(Kinetic.Node, ["width", "height", "listening", "visible"]), Kinetic.Node.prototype.isListening = Kinetic.Node.prototype.getListening, Kinetic.Node.prototype.isVisible = Kinetic.Node.prototype.getVisible;
    var a = ["on", "off"];
    for (var b = 0; b < 2; b++)(function(b) {
        var c = a[b];
        Kinetic.Collection.prototype[c] = function() {
            var a = [].slice.call(arguments);
            a.unshift(c), this.apply.apply(this, a)
        }
    })(b)
})();
(function() {
    Kinetic.Container = function(a) {
        this._containerInit(a)
    }, Kinetic.Container.prototype = {
        _containerInit: function(a) {
            this.children = [], Kinetic.Node.call(this, a)
        },
        getChildren: function() {
            return this.children
        },
        removeChildren: function() {
            while (this.children.length > 0) this.children[0].remove()
        },
        add: function(a) {
            var b = Kinetic.Global,
                c = this.children;
            return a.index = c.length, a.parent = this, c.push(a), this
        },
        get: function(a) {
            var b = new Kinetic.Collection;
            if (a.charAt(0) === "#") {
                var c = this._getNodeById(a.slice(1));
                c && b.push(c)
            } else if (a.charAt(0) === ".") {
                var d = this._getNodesByName(a.slice(1));
                Kinetic.Collection.apply(b, d)
            } else {
                var e = [],
                    f = this.getChildren(),
                    g = f.length;
                for (var h = 0; h < g; h++) e = e.concat(f[h]._get(a));
                Kinetic.Collection.apply(b, e)
            }
            return b
        },
        _getNodeById: function(a) {
            var b = this.getStage(),
                c = Kinetic.Global,
                d = c.ids[a];
            return d !== undefined && this.isAncestorOf(d) ? d : null
        },
        _getNodesByName: function(a) {
            var b = Kinetic.Global,
                c = b.names[a] || [];
            return this._getDescendants(c)
        },
        _get: function(a) {
            var b = Kinetic.Node.prototype._get.call(this, a),
                c = this.getChildren(),
                d = c.length;
            for (var e = 0; e < d; e++) b = b.concat(c[e]._get(a));
            return b
        },
        toObject: function() {
            var a = Kinetic.Node.prototype.toObject.call(this);
            a.children = [];
            var b = this.getChildren(),
                c = b.length;
            for (var d = 0; d < c; d++) {
                var e = b[d];
                a.children.push(e.toObject())
            }
            return a
        },
        _getDescendants: function(a) {
            var b = [],
                c = a.length;
            for (var d = 0; d < c; d++) {
                var e = a[d];
                this.isAncestorOf(e) && b.push(e)
            }
            return b
        },
        isAncestorOf: function(a) {
            var b = a.getParent();
            while (b) {
                if (b._id === this._id) return !0;
                b = b.getParent()
            }
            return !1
        },
        clone: function(a) {
            var b = Kinetic.Node.prototype.clone.call(this, a);
            for (var c in this.children) b.add(this.children[c].clone());
            return b
        },
        getIntersections: function() {
            var a = Kinetic.Type._getXY(Array.prototype.slice.call(arguments)),
                b = [],
                c = this.get("Shape"),
                d = c.length;
            for (var e = 0; e < d; e++) {
                var f = c[e];
                f.isVisible() && f.intersects(a) && b.push(f)
            }
            return b
        },
        _setChildrenIndices: function() {
            var a = this.children,
                b = a.length;
            for (var c = 0; c < b; c++) a[c].index = c
        },
        draw: function() {
            this.drawScene(), this.drawHit()
        },
        drawScene: function(a) {
            if (this.isVisible()) {
                var b = this.children,
                    c = b.length;
                for (var d = 0; d < c; d++) b[d].drawScene(a)
            }
        },
        drawHit: function() {
            if (this.isVisible() && this.isListening()) {
                var a = this.children,
                    b = a.length;
                for (var c = 0; c < b; c++) a[c].drawHit()
            }
        }
    }, Kinetic.Global.extend(Kinetic.Container, Kinetic.Node)
})();
(function() {
    function a(a) {
        a.fill()
    }

    function b(a) {
        a.stroke()
    }

    function c(a) {
        a.fill()
    }

    function d(a) {
        a.stroke()
    }
    Kinetic.Shape = function(a) {
        this._initShape(a)
    }, Kinetic.Shape.prototype = {
        _initShape: function(e) {
            this.setDefaultAttrs({
                fillEnabled: !0,
                strokeEnabled: !0,
                shadowEnabled: !0,
                dashArrayEnabled: !0,
                fillPriority: "color"
            }), this.nodeType = "Shape", this._fillFunc = a, this._strokeFunc = b, this._fillFuncHit = c, this._strokeFuncHit = d;
            var f = Kinetic.Global.shapes,
                g;
            for (;;) {
                g = Kinetic.Type._getRandomColorKey();
                if (g && !(g in f)) break
            }
            this.colorKey = g, f[g] = this, Kinetic.Node.call(this, e)
        },
        getContext: function() {
            return this.getLayer().getContext()
        },
        getCanvas: function() {
            return this.getLayer().getCanvas()
        },
        hasShadow: function() {
            return !!(this.getShadowColor() || this.getShadowBlur() || this.getShadowOffset())
        },
        hasFill: function() {
            return !!(this.getFill() || this.getFillPatternImage() || this.getFillLinearGradientStartPoint() || this.getFillRadialGradientStartPoint())
        },
        _get: function(a) {
            return this.nodeType === a || this.shapeType === a ? [this] : []
        },
        intersects: function() {
            var a = Kinetic.Type._getXY(Array.prototype.slice.call(arguments)),
                b = this.getStage(),
                c = b.hitCanvas;
            c.clear(), this.drawScene(c);
            var d = c.context.getImageData(Math.round(a.x), Math.round(a.y), 1, 1).data;
            return d[3] > 0
        },
        enableFill: function() {
            this.setAttr("fillEnabled", !0)
        },
        disableFill: function() {
            this.setAttr("fillEnabled", !1)
        },
        enableStroke: function() {
            this.setAttr("strokeEnabled", !0)
        },
        disableStroke: function() {
            this.setAttr("strokeEnabled", !1)
        },
        enableShadow: function() {
            this.setAttr("shadowEnabled", !0)
        },
        disableShadow: function() {
            this.setAttr("shadowEnabled", !1)
        },
        enableDashArray: function() {
            this.setAttr("dashArrayEnabled", !0)
        },
        disableDashArray: function() {
            this.setAttr("dashArrayEnabled", !1)
        },
        remove: function() {
            Kinetic.Node.prototype.remove.call(this), delete Kinetic.Global.shapes[this.colorKey]
        },
        drawScene: function(a) {
            var b = this.attrs,
                c = b.drawFunc,
                a = a || this.getLayer().getCanvas(),
                d = a.getContext();
            c && this.isVisible() && (d.save(), a._applyOpacity(this), a._applyLineJoin(this), a._applyAncestorTransforms(this), c.call(this, a), d.restore())
        },
        drawHit: function() {
            var a = this.attrs,
                b = a.drawHitFunc || a.drawFunc,
                c = this.getLayer().hitCanvas,
                d = c.getContext();
            b && this.isVisible() && this.isListening() && (d.save(), c._applyLineJoin(this), c._applyAncestorTransforms(this), b.call(this, c), d.restore())
        },
        _setDrawFuncs: function() {
            !this.attrs.drawFunc && this.drawFunc && this.setDrawFunc(this.drawFunc), !this.attrs.drawHitFunc && this.drawHitFunc && this.setDrawHitFunc(this.drawHitFunc)
        }
    }, Kinetic.Global.extend(Kinetic.Shape, Kinetic.Node), Kinetic.Node.addGettersSetters(Kinetic.Shape, ["stroke", "lineJoin", "lineCap", "strokeWidth", "drawFunc", "drawHitFunc", "dashArray", "shadowColor", "shadowBlur", "shadowOpacity", "fillPatternImage", "fill", "fillPatternX", "fillPatternY", "fillLinearGradientColorStops", "fillRadialGradientStartRadius", "fillRadialGradientEndRadius", "fillRadialGradientColorStops", "fillPatternRepeat", "fillEnabled", "strokeEnabled", "shadowEnabled", "dashArrayEnabled", "fillPriority"]), Kinetic.Node.addPointGettersSetters(Kinetic.Shape, ["fillPatternOffset", "fillPatternScale", "fillLinearGradientStartPoint", "fillLinearGradientEndPoint", "fillRadialGradientStartPoint", "fillRadialGradientEndPoint", "shadowOffset"]), Kinetic.Node.addRotationGettersSetters(Kinetic.Shape, ["fillPatternRotation"])
})();
(function() {
    Kinetic.Stage = function(a) {
        this._initStage(a)
    }, Kinetic.Stage.prototype = {
        _initStage: function(a) {
            var b = Kinetic.DD;
            this.setDefaultAttrs({
                width: 400,
                height: 200
            }), Kinetic.Container.call(this, a), this._setStageDefaultProperties(), this._id = Kinetic.Global.idCounter++, this._buildDOM(), this._bindContentEvents(), Kinetic.Global.stages.push(this), b && b._initDragLayer(this)
        },
        setContainer: function(a) {
            typeof a == "string" && (a = document.getElementById(a)), this.setAttr("container", a)
        },
        setHeight: function(a) {
            Kinetic.Node.prototype.setHeight.call(this, a), this._resizeDOM()
        },
        setWidth: function(a) {
            Kinetic.Node.prototype.setWidth.call(this, a), this._resizeDOM()
        },
        clear: function() {
            var a = this.children;
            for (var b = 0; b < a.length; b++) a[b].clear()
        },
        remove: function() {
            var a = this.content;
            Kinetic.Node.prototype.remove.call(this), a && Kinetic.Type._isInDocument(a) && this.attrs.container.removeChild(a)
        },
        reset: function() {
            this.removeChildren(), this._setStageDefaultProperties(), this.setAttrs(this.defaultNodeAttrs)
        },
        getMousePosition: function() {
            return this.mousePos
        },
        getTouchPosition: function() {
            return this.touchPos
        },
        getUserPosition: function() {
            return this.getTouchPosition() || this.getMousePosition()
        },
        getStage: function() {
            return this
        },
        getContent: function() {
            return this.content
        },
        toDataURL: function(a) {
            function i(d) {
                var e = h[d],
                    j = e.toDataURL(),
                    k = new Image;
                k.onload = function() {
                    g.drawImage(k, 0, 0), d < h.length - 1 ? i(d + 1) : a.callback(f.toDataURL(b, c))
                }, k.src = j
            }
            a = a || {};
            var b = a.mimeType || null,
                c = a.quality || null,
                d = a.x || 0,
                e = a.y || 0,
                f = new Kinetic.SceneCanvas(a.width || this.getWidth(), a.height || this.getHeight()),
                g = f.getContext(),
                h = this.children;
            (d || e) && g.translate(-1 * d, -1 * e), i(0)
        },
        toImage: function(a) {
            var b = a.callback;
            a.callback = function(a) {
                Kinetic.Type._getImage(a, function(a) {
                    b(a)
                })
            }, this.toDataURL(a)
        },
        getIntersection: function(a) {
            var b, c = this.getChildren();
            for (var d = c.length - 1; d >= 0; d--) {
                var e = c[d];
                if (e.isVisible() && e.isListening()) {
                    var f = e.hitCanvas.context.getImageData(Math.round(a.x), Math.round(a.y), 1, 1).data;
                    if (f[3] === 255) {
                        var g = Kinetic.Type._rgbToHex(f[0], f[1], f[2]);
                        return b = Kinetic.Global.shapes[g], {
                            shape: b,
                            pixel: f
                        }
                    }
                    if (f[0] > 0 || f[1] > 0 || f[2] > 0 || f[3] > 0) return {
                        pixel: f
                    }
                }
            }
            return null
        },
        _resizeDOM: function() {
            if (this.content) {
                var a = this.attrs.width,
                    b = this.attrs.height;
                this.content.style.width = a + "px", this.content.style.height = b + "px", this.bufferCanvas.setSize(a, b, 1), this.hitCanvas.setSize(a, b);
                var c = this.children;
                for (var d = 0; d < c.length; d++) {
                    var e = c[d];
                    e.getCanvas().setSize(a, b), e.hitCanvas.setSize(a, b), e.draw()
                }
            }
        },
        add: function(a) {
            return Kinetic.Container.prototype.add.call(this, a), a.canvas.setSize(this.attrs.width, this.attrs.height), a.hitCanvas.setSize(this.attrs.width, this.attrs.height), a.draw(), this.content.appendChild(a.canvas.element), this
        },
        getDragLayer: function() {
            return this.dragLayer
        },
        _setUserPosition: function(a) {
            a || (a = window.event), this._setMousePosition(a), this._setTouchPosition(a)
        },
        _bindContentEvents: function() {
            var a = Kinetic.Global,
                b = this,
                c = ["mousedown", "mousemove", "mouseup", "mouseout", "touchstart", "touchmove", "touchend"];
            for (var d = 0; d < c.length; d++) {
                var e = c[d];
                (function() {
                    var a = e;
                    b.content.addEventListener(a, function(c) {
                        b["_" + a](c)
                    }, !1)
                })()
            }
        },
        _mouseout: function(a) {
            this._setUserPosition(a);
            var b = Kinetic.DD,
                c = this.targetShape;
            c && (!b || !b.moving) && (c._handleEvent("mouseout", a), c._handleEvent("mouseleave", a), this.targetShape = null), this.mousePos = undefined
        },
        _mousemove: function(a) {
            this._setUserPosition(a);
            var b = Kinetic.DD,
                c = this.getIntersection(this.getUserPosition());
            if (c) {
                var d = c.shape;
                d && (!!b && !!b.moving || c.pixel[3] !== 255 || !!this.targetShape && this.targetShape._id === d._id ? d._handleEvent("mousemove", a) : (this.targetShape && (this.targetShape._handleEvent("mouseout", a, d), this.targetShape._handleEvent("mouseleave", a, d)), d._handleEvent("mouseover", a, this.targetShape), d._handleEvent("mouseenter", a, this.targetShape), this.targetShape = d))
            } else this.targetShape && (!b || !b.moving) && (this.targetShape._handleEvent("mouseout", a), this.targetShape._handleEvent("mouseleave", a), this.targetShape = null);
            b && b._drag(a)
        },
        _mousedown: function(a) {
            var b, c = Kinetic.DD;
            this._setUserPosition(a), b = this.getIntersection(this.getUserPosition());
            if (b && b.shape) {
                var d = b.shape;
                this.clickStart = !0, d._handleEvent("mousedown", a)
            }
            c && this.attrs.draggable && !c.node && this._startDrag(a)
        },
        _mouseup: function(a) {
            this._setUserPosition(a);
            var b = this,
                c = Kinetic.DD,
                d = this.getIntersection(this.getUserPosition());
            if (d && d.shape) {
                var e = d.shape;
                e._handleEvent("mouseup", a), this.clickStart && (!c || !c.moving || !c.node) && (e._handleEvent("click", a), this.inDoubleClickWindow && e._handleEvent("dblclick", a), this.inDoubleClickWindow = !0, setTimeout(function() {
                    b.inDoubleClickWindow = !1
                }, this.dblClickWindow))
            }
            this.clickStart = !1
        },
        _touchstart: function(a) {
            var b, c = Kinetic.DD;
            this._setUserPosition(a), a.preventDefault(), b = this.getIntersection(this.getUserPosition());
            if (b && b.shape) {
                var d = b.shape;
                this.tapStart = !0, d._handleEvent("touchstart", a)
            }
            c && this.attrs.draggable && !c.node && this._startDrag(a)
        },
        _touchend: function(a) {
            this._setUserPosition(a);
            var b = this,
                c = Kinetic.DD,
                d = this.getIntersection(this.getUserPosition());
            if (d && d.shape) {
                var e = d.shape;
                e._handleEvent("touchend", a), this.tapStart && (!c || !c.moving || !c.node) && (e._handleEvent("tap", a), this.inDoubleClickWindow && e._handleEvent("dbltap", a), this.inDoubleClickWindow = !0, setTimeout(function() {
                    b.inDoubleClickWindow = !1
                }, this.dblClickWindow))
            }
            this.tapStart = !1
        },
        _touchmove: function(a) {
            this._setUserPosition(a);
            var b = Kinetic.DD;
            a.preventDefault();
            var c = this.getIntersection(this.getUserPosition());
            if (c && c.shape) {
                var d = c.shape;
                d._handleEvent("touchmove", a)
            }
            b && b._drag(a)
        },
        _setMousePosition: function(a) {
            var b = a.clientX - this._getContentPosition().left,
                c = a.clientY - this._getContentPosition().top;
            this.mousePos = {
                x: b,
                y: c
            }
        },
        _setTouchPosition: function(a) {
            if (a.touches !== undefined && a.touches.length === 1) {
                var b = a.touches[0],
                    c = b.clientX - this._getContentPosition().left,
                    d = b.clientY - this._getContentPosition().top;
                this.touchPos = {
                    x: c,
                    y: d
                }
            }
        },
        _getContentPosition: function() {
            var a = this.content.getBoundingClientRect();
            return {
                top: a.top,
                left: a.left
            }
        },
        _buildDOM: function() {
            this.content = document.createElement("div"), this.content.style.position = "relative", this.content.style.display = "inline-block", this.content.className = "kineticjs-content", this.attrs.container.appendChild(this.content), this.bufferCanvas = new Kinetic.SceneCanvas, this.hitCanvas = new Kinetic.HitCanvas, this._resizeDOM()
        },
        _onContent: function(a, b) {
            var c = a.split(" ");
            for (var d = 0; d < c.length; d++) {
                var e = c[d];
                this.content.addEventListener(e, b, !1)
            }
        },
        _setStageDefaultProperties: function() {
            this.nodeType = "Stage", this.dblClickWindow = 400, this.targetShape = null, this.mousePos = undefined, this.clickStart = !1, this.touchPos = undefined, this.tapStart = !1
        }
    }, Kinetic.Global.extend(Kinetic.Stage, Kinetic.Container), Kinetic.Node.addGetters(Kinetic.Stage, ["container"])
})();
(function() {
    Kinetic.Layer = function(a) {
        this._initLayer(a)
    }, Kinetic.Layer.prototype = {
        _initLayer: function(a) {
            this.setDefaultAttrs({
                clearBeforeDraw: !0
            }), this.nodeType = "Layer", this.beforeDrawFunc = undefined, this.afterDrawFunc = undefined, this.canvas = new Kinetic.SceneCanvas, this.canvas.getElement().style.position = "absolute", this.hitCanvas = new Kinetic.HitCanvas, Kinetic.Container.call(this, a)
        },
        draw: function() {
            var a = this.getContext();
            this.beforeDrawFunc !== undefined && this.beforeDrawFunc.call(this), Kinetic.Container.prototype.draw.call(this), this.afterDrawFunc !== undefined && this.afterDrawFunc.call(this)
        },
        drawHit: function() {
            this.hitCanvas.clear(), Kinetic.Container.prototype.drawHit.call(this)
        },
        drawScene: function(a) {
            a = a || this.getCanvas(), this.attrs.clearBeforeDraw && a.clear(), Kinetic.Container.prototype.drawScene.call(this, a)
        },
        toDataURL: function(a) {
            a = a || {};
            var b = a.mimeType || null,
                c = a.quality || null,
                d, e, f = a.x || 0,
                g = a.y || 0;
            return a.width || a.height || a.x || a.y ? Kinetic.Node.prototype.toDataURL.call(this, a) : this.getCanvas().toDataURL(b, c)
        },
        beforeDraw: function(a) {
            this.beforeDrawFunc = a
        },
        afterDraw: function(a) {
            this.afterDrawFunc = a
        },
        getCanvas: function() {
            return this.canvas
        },
        getContext: function() {
            return this.canvas.context
        },
        clear: function() {
            this.getCanvas().clear()
        },
        setVisible: function(a) {
            Kinetic.Node.prototype.setVisible.call(this, a), a ? (this.canvas.element.style.display = "block", this.hitCanvas.element.style.display = "block") : (this.canvas.element.style.display = "none", this.hitCanvas.element.style.display = "none")
        },
        setZIndex: function(a) {
            Kinetic.Node.prototype.setZIndex.call(this, a);
            var b = this.getStage();
            b && (b.content.removeChild(this.canvas.element), a < b.getChildren().length - 1 ? b.content.insertBefore(this.canvas.element, b.getChildren()[a + 1].canvas.element) : b.content.appendChild(this.canvas.element))
        },
        moveToTop: function() {
            Kinetic.Node.prototype.moveToTop.call(this);
            var a = this.getStage();
            a && (a.content.removeChild(this.canvas.element), a.content.appendChild(this.canvas.element))
        },
        moveUp: function() {
            if (Kinetic.Node.prototype.moveUp.call(this)) {
                var a = this.getStage();
                a && (a.content.removeChild(this.canvas.element), this.index < a.getChildren().length - 1 ? a.content.insertBefore(this.canvas.element, a.getChildren()[this.index + 1].canvas.element) : a.content.appendChild(this.canvas.element))
            }
        },
        moveDown: function() {
            if (Kinetic.Node.prototype.moveDown.call(this)) {
                var a = this.getStage();
                if (a) {
                    var b = a.getChildren();
                    a.content.removeChild(this.canvas.element), a.content.insertBefore(this.canvas.element, b[this.index + 1].canvas.element)
                }
            }
        },
        moveToBottom: function() {
            if (Kinetic.Node.prototype.moveToBottom.call(this)) {
                var a = this.getStage();
                if (a) {
                    var b = a.getChildren();
                    a.content.removeChild(this.canvas.element), a.content.insertBefore(this.canvas.element, b[1].canvas.element)
                }
            }
        },
        getLayer: function() {
            return this
        },
        remove: function() {
            var a = this.getStage(),
                b = this.canvas,
                c = b.element;
            Kinetic.Node.prototype.remove.call(this), a && b && Kinetic.Type._isInDocument(c) && a.content.removeChild(c)
        }
    }, Kinetic.Global.extend(Kinetic.Layer, Kinetic.Container), Kinetic.Node.addGettersSetters(Kinetic.Layer, ["clearBeforeDraw"])
})();
(function() {
    Kinetic.Group = function(a) {
        this._initGroup(a)
    }, Kinetic.Group.prototype = {
        _initGroup: function(a) {
            this.nodeType = "Group", Kinetic.Container.call(this, a)
        }
    }, Kinetic.Global.extend(Kinetic.Group, Kinetic.Container)
})();
(function() {
    Kinetic.Rect = function(a) {
        this._initRect(a)
    }, Kinetic.Rect.prototype = {
        _initRect: function(a) {
            this.setDefaultAttrs({
                width: 0,
                height: 0,
                cornerRadius: 0
            }), Kinetic.Shape.call(this, a), this.shapeType = "Rect", this._setDrawFuncs()
        },
        drawFunc: function(a) {
            var b = a.getContext();
            b.beginPath();
            var c = this.getCornerRadius(),
                d = this.getWidth(),
                e = this.getHeight();
            c === 0 ? b.rect(0, 0, d, e) : (b.moveTo(c, 0), b.lineTo(d - c, 0), b.arc(d - c, c, c, Math.PI * 3 / 2, 0, !1), b.lineTo(d, e - c), b.arc(d - c, e - c, c, 0, Math.PI / 2, !1), b.lineTo(c, e), b.arc(c, e - c, c, Math.PI / 2, Math.PI, !1), b.lineTo(0, c), b.arc(c, c, c, Math.PI, Math.PI * 3 / 2, !1)), b.closePath(), a.fillStroke(this)
        }
    }, Kinetic.Global.extend(Kinetic.Rect, Kinetic.Shape), Kinetic.Node.addGettersSetters(Kinetic.Rect, ["cornerRadius"])
})();
(function() {
    function v(a) {
        a.fillText(this.partialText, 0, 0)
    }

    function w(a) {
        a.strokeText(this.partialText, 0, 0)
    }
    var a = "auto",
        b = "Calibri",
        c = "canvas",
        d = "center",
        e = "Change.kinetic",
        f = "2d",
        g = "\n",
        h = "",
        i = "left",
        j = "\n",
        k = "text",
        l = "Text",
        m = "top",
        o = "middle",
        p = "normal",
        q = "px ",
        r = " ",
        s = "right",
        t = ["fontFamily", "fontSize", "fontStyle", "padding", "align", "lineHeight", "text", "width", "height"],
        u = t.length;
    Kinetic.Text = function(a) {
        this._initText(a)
    }, Kinetic.Text.prototype = {
        _initText: function(d) {
            var f = this;
            this.setDefaultAttrs({
                fontFamily: b,
                text: h,
                fontSize: 12,
                align: i,
                verticalAlign: m,
                fontStyle: p,
                padding: 0,
                width: a,
                height: a,
                lineHeight: 1
            }), this.dummyCanvas = document.createElement(c), Kinetic.Shape.call(this, d), this._fillFunc = v, this._strokeFunc = w, this.shapeType = l, this._setDrawFuncs();
            for (var g = 0; g < u; g++) this.on(t[g] + e, f._setTextData);
            this._setTextData()
        },
        drawFunc: function(a) {
            var b = a.getContext(),
                c = this.getPadding(),
                e = this.getFontStyle(),
                f = this.getFontSize(),
                g = this.getFontFamily(),
                h = this.getTextHeight(),
                j = this.getLineHeight() * h,
                k = this.textArr,
                l = k.length,
                m = this.getWidth();
            b.font = e + r + f + q + g, b.textBaseline = o, b.textAlign = i, b.save(), b.translate(c, 0), b.translate(0, c + h / 2);
            for (var n = 0; n < l; n++) {
                var p = k[n],
                    t = p.text,
                    u = p.width;
                b.save(), this.getAlign() === s ? b.translate(m - u - c * 2, 0) : this.getAlign() === d && b.translate((m - u - c * 2) / 2, 0), this.partialText = t, a.fillStroke(this), b.restore(), b.translate(0, j)
            }
            b.restore()
        },
        drawHitFunc: function(a) {
            var b = a.getContext(),
                c = this.getWidth(),
                d = this.getHeight();
            b.beginPath(), b.rect(0, 0, c, d), b.closePath(), a.fillStroke(this)
        },
        setText: function(a) {
            var b = Kinetic.Type._isString(a) ? a : a.toString();
            this.setAttr(k, b)
        },
        getWidth: function() {
            return this.attrs.width === a ? this.getTextWidth() + this.getPadding() * 2 : this.attrs.width
        },
        getHeight: function() {
            return this.attrs.height === a ? this.getTextHeight() * this.textArr.length * this.attrs.lineHeight + this.attrs.padding * 2 : this.attrs.height
        },
        getTextWidth: function() {
            return this.textWidth
        },
        getTextHeight: function() {
            return this.textHeight
        },
        _getTextSize: function(a) {
            var b = this.dummyCanvas,
                c = b.getContext(f),
                d = this.getFontSize(),
                e;
            return c.save(), c.font = this.getFontStyle() + r + d + q + this.getFontFamily(), e = c.measureText(a), c.restore(), {
                width: e.width,
                height: parseInt(d, 10)
            }
        },
        _getTextSizeSkipContext: function(a) {
            var b = this.dummyCanvas,
                c = b.getContext(f),
                d = this.getFontSize(),
                e;
            return c.font = this.getFontStyle() + r + d + q + this.getFontFamily(), e = c.measureText(a), {
                width: e.width,
                height: parseInt(d, 10)
            }
        },
        _expandTextData: function(a) {
            var b = a.length;
            n = 0, text = h, newArr = [];
            for (n = 0; n < b; n++) text = a[n], newArr.push({
                text: text,
                width: this._getTextSize(text).width
            });
            return newArr
        },
        _setTextData: function() {
            this.dummyCanvas.getContext("2d").save();
            var b = this.getText().split(h),
                c = [],
                d = 0;
            addLine = !0, lineHeightPx = 0, padding = this.getPadding(), this.textWidth = 0, this.textHeight = this._getTextSizeSkipContext(this.getText()).height, lineHeightPx = this.getLineHeight() * this.textHeight;
            while (b.length > 0 && addLine && (this.attrs.height === a || lineHeightPx * (d + 1) < this.attrs.height - padding * 2)) {
                var e = 0,
                    f = undefined;
                addLine = !1;
                while (e < b.length) {
                    if (b.indexOf(j) === e) {
                        b.splice(e, 1), f = b.splice(0, e).join(h);
                        break
                    }
                    var i = b.slice(0, e);
                    if (this.attrs.width !== a && this._getTextSizeSkipContext(i.join(h)).width > this.attrs.width - padding * 2) {
                        if (e == 0) break;
                        var k = i.lastIndexOf(r),
                            l = i.lastIndexOf(g),
                            m = Math.max(k, l);
                        if (m >= 0) {
                            f = b.splice(0, 1 + m).join(h);
                            break
                        }
                        f = b.splice(0, e).join(h);
                        break
                    }
                    e++, e === b.length && (f = b.splice(0, e).join(h))
                }
                this.textWidth = Math.max(this.textWidth, this._getTextSizeSkipContext(f).width), f !== undefined && (c.push(f), addLine = !0), d++
            }
            this.textArr = this._expandTextData(c)
            this.dummyCanvas.getContext("2d").restore();
        }
    }, Kinetic.Global.extend(Kinetic.Text, Kinetic.Shape), Kinetic.Node.addGettersSetters(Kinetic.Text, ["fontFamily", "fontSize", "fontStyle", "padding", "align", "lineHeight"]), Kinetic.Node.addGetters(Kinetic.Text, [k])
})();
(function() {
    Kinetic.Line = function(a) {
        this._initLine(a)
    }, Kinetic.Line.prototype = {
        _initLine: function(a) {
            this.setDefaultAttrs({
                points: [],
                lineCap: "butt"
            }), Kinetic.Shape.call(this, a), this.shapeType = "Line", this._setDrawFuncs()
        },
        drawFunc: function(a) {
            var b = this.getPoints(),
                c = b.length,
                d = a.getContext();
            d.beginPath(), d.moveTo(b[0].x, b[0].y);
            for (var e = 1; e < c; e++) {
                var f = b[e];
                d.lineTo(f.x, f.y)
            }
            a.stroke(this)
        },
        setPoints: function(a) {
            this.setAttr("points", Kinetic.Type._getPoints(a))
        }
    }, Kinetic.Global.extend(Kinetic.Line, Kinetic.Shape), Kinetic.Node.addGetters(Kinetic.Line, ["points"])
})();
