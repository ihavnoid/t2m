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

Kinetic.version = "4.3.3";
Kinetic.Filters = {};
Kinetic.Plugins = {};
Kinetic.Global = {
    stages: [],
    idCounter: 0,
    ids: {},
    names: {},
    shapes: {},
    warn: function (a) {
        window.console && console.warn && console.warn("Kinetic warning: " + a);
    },
    extend: function (a, b) {
        for (var c in b.prototype)
            c in a.prototype || (a.prototype[c] = b.prototype[c]);
    },
    _addId: function (a, b) {
        b !== undefined && (this.ids[b] = a);
    },
    _removeId: function (a) {
        a !== undefined && delete this.ids[a];
    },
    _addName: function (a, b) {
        b !== undefined &&
            (this.names[b] === undefined && (this.names[b] = []),
            this.names[b].push(a));
    },
    _removeName: function (a, b) {
        if (a !== undefined) {
            var c = this.names[a];
            if (c !== undefined) {
                for (var d = 0; d < c.length; d++) {
                    var e = c[d];
                    e._id === b && c.splice(d, 1);
                }
                c.length === 0 && delete this.names[a];
            }
        }
    },
};

Kinetic.Type = {
    _isElement: function (a) {
        return !!a && a.nodeType == 1;
    },
    _isFunction: function (a) {
        return !!(a && a.constructor && a.call && a.apply);
    },
    _isObject: function (a) {
        return !!a && a.constructor == Object;
    },
    _isArray: function (a) {
        return Object.prototype.toString.call(a) == "[object Array]";
    },
    _isNumber: function (a) {
        return Object.prototype.toString.call(a) == "[object Number]";
    },
    _isString: function (a) {
        return Object.prototype.toString.call(a) == "[object String]";
    },
    _hasMethods: function (a) {
        var b = [];
        for (var c in a) this._isFunction(a[c]) && b.push(c);
        return b.length > 0;
    },
    _isInDocument: function (a) {
        while ((a = a.parentNode)) if (a == document) return !0;
        return !1;
    },
    _getXY: function (a) {
        if (this._isNumber(a))
            return {
                x: a,
                y: a,
            };
        if (this._isArray(a)) {
            if (a.length === 1) {
                var b = a[0];
                if (this._isNumber(b))
                    return {
                        x: b,
                        y: b,
                    };
                if (this._isArray(b))
                    return {
                        x: b[0],
                        y: b[1],
                    };
                if (this._isObject(b)) return b;
            } else if (a.length >= 2)
                return {
                    x: a[0],
                    y: a[1],
                };
        } else if (this._isObject(a)) return a;
        return null;
    },
    _getSize: function (a) {
        if (this._isNumber(a))
            return {
                width: a,
                height: a,
            };
        if (this._isArray(a))
            if (a.length === 1) {
                var b = a[0];
                if (this._isNumber(b))
                    return {
                        width: b,
                        height: b,
                    };
                if (this._isArray(b)) {
                    if (b.length >= 4)
                        return {
                            width: b[2],
                            height: b[3],
                        };
                    if (b.length >= 2)
                        return {
                            width: b[0],
                            height: b[1],
                        };
                } else if (this._isObject(b)) return b;
            } else {
                if (a.length >= 4)
                    return {
                        width: a[2],
                        height: a[3],
                    };
                if (a.length >= 2)
                    return {
                        width: a[0],
                        height: a[1],
                    };
            }
        else if (this._isObject(a)) return a;
        return null;
    },
    _getPoints: function (a) {
        if (a === undefined) return [];
        if (this._isArray(a[0])) {
            var b = [];
            for (var c = 0; c < a.length; c++)
                b.push({
                    x: a[c][0],
                    y: a[c][1],
                });
            return b;
        }
        if (this._isObject(a[0])) return a;
        var b = [];
        for (var c = 0; c < a.length; c += 2)
            b.push({
                x: a[c],
                y: a[c + 1],
            });
        return b;
    },
    _getImage: function (a, b) {
        if (!a) b(null);
        else if (this._isElement(a)) b(a);
        else if (this._isString(a)) {
            var c = new Image();
            ((c.onload = function () {
                b(c);
            }),
                (c.src = a));
        } else if (a.data) {
            var d = document.createElement("canvas");
            ((d.width = a.width), (d.height = a.height));
            var e = d.getContext("2d", {
                willReadFrequently: true,
            });
            e.putImageData(a, 0, 0);
            var f = d.toDataURL(),
                c = new Image();
            ((c.onload = function () {
                b(c);
            }),
                (c.src = f));
        } else b(null);
    },
    _rgbToHex: function (a, b, c) {
        return ((1 << 24) + (a << 16) + (b << 8) + c).toString(16).slice(1);
    },
    _hexToRgb: function (a) {
        var b = parseInt(a, 16);
        return {
            r: (b >> 16) & 255,
            g: (b >> 8) & 255,
            b: b & 255,
        };
    },
    _getRandomColorKey: function () {
        var a = Math.round(Math.random() * 255),
            b = Math.round(Math.random() * 255),
            c = Math.round(Math.random() * 255);
        return this._rgbToHex(a, b, c);
    },
    _merge: function (a, b) {
        var c = this._clone(b);
        for (var d in a)
            this._isObject(a[d])
                ? (c[d] = this._merge(a[d], c[d]))
                : (c[d] = a[d]);
        return c;
    },
    _clone: function (a) {
        var b = {};
        for (var c in a)
            this._isObject(a[c]) ? (b[c] = this._clone(a[c])) : (b[c] = a[c]);
        return b;
    },
    _degToRad: function (a) {
        return (a * Math.PI) / 180;
    },
    _radToDeg: function (a) {
        return (a * 180) / Math.PI;
    },
};
const tempCanvas = document.createElement("canvas");
const tempContext = tempCanvas.getContext("2d", {
    willReadFrequently: true,
});
const devicePixelRatio = window.devicePixelRatio || 1;
const backingStorePixelRatio =
    tempContext.webkitBackingStorePixelRatio ||
    tempContext.mozBackingStorePixelRatio ||
    tempContext.msBackingStorePixelRatio ||
    tempContext.oBackingStorePixelRatio ||
    tempContext.backingStorePixelRatio ||
    1;
const defaultPixelRatio = devicePixelRatio / backingStorePixelRatio;
Kinetic.Canvas = class {
    constructor(width, height, pixelRatio) {
        this.pixelRatio = pixelRatio || defaultPixelRatio;
        this.width = width;
        this.height = height;
        this.element = document.createElement("canvas");
        this.context = this.element.getContext("2d", {
            willReadFrequently: true,
        });
        this.setSize(width || 0, height || 0);
    }
    clear() {
        var context = this.getContext(),
            element = this.getElement();
        context.clearRect(0, 0, element.width, element.height);
    }
    getElement() {
        return this.element;
    }
    getContext() {
        return this.context;
    }
    setWidth(width) {
        this.width = width;
        this.element.width = width * this.pixelRatio;
        this.element.style.width = width + "px";
    }
    setHeight(height) {
        this.height = height;
        this.element.height = height * this.pixelRatio;
        this.element.style.height = height + "px";
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    setSize(width, height) {
        this.setWidth(width);
        this.setHeight(height);
    }
    toDataURL(mimeType, quality) {
        try {
            return this.element.toDataURL(mimeType, quality);
        } catch (err) {
            try {
                return this.element.toDataURL();
            } catch (err2) {
                Kinetic.Global.warn("Unable to get data URL. " + err2.message);
                return "";
            }
        }
    }
    fill(shape) {
        shape.getFillEnabled() && this._fill(shape);
    }
    stroke(shape) {
        shape.getStrokeEnabled() && this._stroke(shape);
    }
    fillStroke(shape) {
        var hasFill = shape.getFillEnabled();
        hasFill && this._fill(shape);
        shape.getStrokeEnabled() &&
            this._stroke(
                shape,
                shape.hasShadow() && shape.hasFill() && hasFill,
            );
    }
    applyShadow(shape, drawFunc) {
        var context = this.context;
        context.save();
        this._applyShadow(shape);
        drawFunc();
        context.restore();
        drawFunc();
    }
    _applyLineCap(shape) {
        var lineCap = shape.getLineCap();
        lineCap && (this.context.lineCap = lineCap);
    }
    _applyOpacity(shape) {
        var opacity = shape.getAbsoluteOpacity();
        opacity !== 1 && (this.context.globalAlpha = opacity);
    }
    _applyLineJoin(shape) {
        var lineJoin = shape.getLineJoin();
        lineJoin && (this.context.lineJoin = lineJoin);
    }
    _applyAncestorTransforms(shape) {
        var context = this.context;
        shape._eachAncestorReverse(function (ancestor) {
            var transform = ancestor.getTransform(),
                matrix = transform.getMatrix();
            context.transform(
                matrix[0],
                matrix[1],
                matrix[2],
                matrix[3],
                matrix[4],
                matrix[5],
            );
        }, true);
    }
};

Kinetic.SceneCanvas = class extends Kinetic.Canvas {
    setWidth(width) {
        super.setWidth(width);
        this.context.scale(this.pixelRatio, this.pixelRatio);
    }
    setHeight(height) {
        super.setHeight(height);
        this.context.scale(this.pixelRatio, this.pixelRatio);
    }
    _fillColor(shape) {
        var context = this.context,
            fill = shape.getFill();
        context.fillStyle = fill;
        shape._fillFunc(context);
    }
    _fillPattern(shape) {
        var context = this.context,
            image = shape.getFillPatternImage(),
            x = shape.getFillPatternX(),
            y = shape.getFillPatternY(),
            scale = shape.getFillPatternScale(),
            rotation = shape.getFillPatternRotation(),
            offset = shape.getFillPatternOffset(),
            repeat = shape.getFillPatternRepeat();
        (x || y) && context.translate(x || 0, y || 0);
        rotation && context.rotate(rotation);
        scale && context.scale(scale.x, scale.y);
        offset && context.translate(-1 * offset.x, -1 * offset.y);
        context.fillStyle = context.createPattern(image, repeat || "repeat");
        context.fill();
    }
    _fillLinearGradient(shape) {
        var context = this.context,
            startPoint = shape.getFillLinearGradientStartPoint(),
            endPoint = shape.getFillLinearGradientEndPoint(),
            colorStops = shape.getFillLinearGradientColorStops(),
            gradient = context.createLinearGradient(
                startPoint.x,
                startPoint.y,
                endPoint.x,
                endPoint.y,
            );
        for (var i = 0; i < colorStops.length; i += 2) {
            gradient.addColorStop(colorStops[i], colorStops[i + 1]);
        }
        context.fillStyle = gradient;
        context.fill();
    }
    _fillRadialGradient(shape) {
        var context = this.context,
            startPoint = shape.getFillRadialGradientStartPoint(),
            endPoint = shape.getFillRadialGradientEndPoint(),
            startRadius = shape.getFillRadialGradientStartRadius(),
            endRadius = shape.getFillRadialGradientEndRadius(),
            colorStops = shape.getFillRadialGradientColorStops(),
            gradient = context.createRadialGradient(
                startPoint.x,
                startPoint.y,
                startRadius,
                endPoint.x,
                endPoint.y,
                endRadius,
            );
        for (var i = 0; i < colorStops.length; i += 2) {
            gradient.addColorStop(colorStops[i], colorStops[i + 1]);
        }
        context.fillStyle = gradient;
        context.fill();
    }
    _fill(shape, skipShadow) {
        var context = this.context,
            fill = shape.getFill(),
            patternImage = shape.getFillPatternImage(),
            linearStart = shape.getFillLinearGradientStartPoint(),
            radialStart = shape.getFillRadialGradientStartPoint(),
            priority = shape.getFillPriority();
        context.save();
        !skipShadow && shape.hasShadow() && this._applyShadow(shape);
        fill && priority === "color"
            ? this._fillColor(shape)
            : patternImage && priority === "pattern"
              ? this._fillPattern(shape)
              : linearStart && priority === "linear-gradient"
                ? this._fillLinearGradient(shape)
                : radialStart && priority === "radial-gradient"
                  ? this._fillRadialGradient(shape)
                  : fill
                    ? this._fillColor(shape)
                    : patternImage
                      ? this._fillPattern(shape)
                      : linearStart
                        ? this._fillLinearGradient(shape)
                        : radialStart && this._fillRadialGradient(shape);
        context.restore();
        !skipShadow && shape.hasShadow() && this._fill(shape, true);
    }
    _stroke(shape, skipShadow) {
        var context = this.context,
            stroke = shape.getStroke(),
            strokeWidth = shape.getStrokeWidth(),
            dashArray = shape.getDashArray();
        if (stroke || strokeWidth) {
            context.save();
            this._applyLineCap(shape);
            dashArray &&
                shape.getDashArrayEnabled() &&
                (context.setLineDash
                    ? context.setLineDash(dashArray)
                    : "mozDash" in context
                      ? (context.mozDash = dashArray)
                      : "webkitLineDash" in context &&
                        (context.webkitLineDash = dashArray));
            !skipShadow && shape.hasShadow() && this._applyShadow(shape);
            context.lineWidth = strokeWidth || 2;
            context.strokeStyle = stroke || "black";
            shape._strokeFunc(context);
            context.restore();
            !skipShadow && shape.hasShadow() && this._stroke(shape, true);
        }
    }
    _applyShadow(shape) {
        var context = this.context;
        if (shape.hasShadow() && shape.getShadowEnabled()) {
            var opacity = shape.getAbsoluteOpacity(),
                shadowColor = shape.getShadowColor() || "black",
                shadowBlur = shape.getShadowBlur() || 5,
                shadowOffset = shape.getShadowOffset() || {
                    x: 0,
                    y: 0,
                };
            shape.getShadowOpacity() &&
                (context.globalAlpha = shape.getShadowOpacity() * opacity);
            context.shadowColor = shadowColor;
            context.shadowBlur = shadowBlur;
            context.shadowOffsetX = shadowOffset.x;
            context.shadowOffsetY = shadowOffset.y;
        }
    }
};

Kinetic.HitCanvas = class extends Kinetic.Canvas {
    _fill(shape) {
        var context = this.context;
        context.save();
        context.fillStyle = "#" + shape.colorKey;
        shape._fillFuncHit(context);
        context.restore();
    }
    _stroke(shape) {
        var context = this.context,
            stroke = shape.getStroke(),
            strokeWidth = shape.getStrokeWidth();
        if (stroke || strokeWidth) {
            this._applyLineCap(shape);
            context.save();
            context.lineWidth = strokeWidth || 2;
            context.strokeStyle = "#" + shape.colorKey;
            shape._strokeFuncHit(context);
            context.restore();
        }
    }
};
Kinetic.Transform = class {
    constructor() {
        this.m = [1, 0, 0, 1, 0, 0];
    }

    translate(x, y) {
        this.m[4] += this.m[0] * x + this.m[2] * y;
        this.m[5] += this.m[1] * x + this.m[3] * y;
    }

    scale(x, y) {
        this.m[0] *= x;
        this.m[1] *= x;
        this.m[2] *= y;
        this.m[3] *= y;
    }

    rotate(rad) {
        var cosVal = Math.cos(rad),
            sinVal = Math.sin(rad),
            m00 = this.m[0] * cosVal + this.m[2] * sinVal,
            m10 = this.m[1] * cosVal + this.m[3] * sinVal,
            m01 = this.m[0] * -sinVal + this.m[2] * cosVal,
            m11 = this.m[1] * -sinVal + this.m[3] * cosVal;
        this.m[0] = m00;
        this.m[1] = m10;
        this.m[2] = m01;
        this.m[3] = m11;
    }

    getTranslation() {
        return {
            x: this.m[4],
            y: this.m[5],
        };
    }

    multiply(matrix) {
        var m00 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1],
            m10 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1],
            m01 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3],
            m11 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3],
            m02 = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4],
            m12 = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];
        this.m[0] = m00;
        this.m[1] = m10;
        this.m[2] = m01;
        this.m[3] = m11;
        this.m[4] = m02;
        this.m[5] = m12;
    }

    invert() {
        var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]),
            m00 = this.m[3] * d,
            m10 = -this.m[1] * d,
            m01 = -this.m[2] * d,
            m11 = this.m[0] * d,
            m02 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]),
            m12 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
        this.m[0] = m00;
        this.m[1] = m10;
        this.m[2] = m01;
        this.m[3] = m11;
        this.m[4] = m02;
        this.m[5] = m12;
    }

    getMatrix() {
        return this.m;
    }
};
Kinetic.Collection = function (...args) {
    this.length = args.length;
    for (let i = 0; i < args.length; i++) {
        this[i] = args[i];
    }
    return this;
};
Kinetic.Collection.prototype = new Array();
Kinetic.Collection.prototype.apply = function (action, ...args) {
    for (var b = 0; b < this.length; b++) {
        if (Kinetic.Type._isFunction(this[b][action])) {
            this[b][action](...args);
        }
    }
};
Kinetic.Collection.prototype.each = function (callback) {
    for (var b = 0; b < this.length; b++) {
        callback.call(this[b], b, this[b]);
    }
};
Kinetic.Node = class {
    constructor(config) {
        if (this.constructor === Kinetic.Node) {
            this._nodeInit(config);
        }
    }

    _nodeInit(config) {
        this._id = Kinetic.Global.idCounter++;
        this.defaultNodeAttrs = {
            visible: true,
            listening: true,
            name: undefined,
            opacity: 1,
            x: 0,
            y: 0,
            scale: {
                x: 1,
                y: 1,
            },
            rotation: 0,
            offset: {
                x: 0,
                y: 0,
            },
            draggable: false,
            dragOnTop: true,
        };
        this.setDefaultAttrs(this.defaultNodeAttrs);
        this.eventListeners = {};
        this.setAttrs(config);
    }

    on(evtStr, handler) {
        var events = evtStr.split(" "),
            len = events.length;
        for (var i = 0; i < len; i++) {
            var eventName = events[i],
                parts = eventName.split("."),
                baseEvent = parts[0],
                ns = parts.length > 1 ? parts[1] : "";
            this.eventListeners[baseEvent] ||
                (this.eventListeners[baseEvent] = []);
            this.eventListeners[baseEvent].push({
                name: ns,
                handler: handler,
            });
        }
    }

    off(evtStr) {
        var events = evtStr.split(" "),
            len = events.length;
        for (var i = 0; i < len; i++) {
            var eventName = events[i],
                parts = eventName.split("."),
                baseEvent = parts[0];
            if (parts.length > 1) {
                if (baseEvent) {
                    this.eventListeners[baseEvent] &&
                        this._off(baseEvent, parts[1]);
                } else {
                    for (var ev in this.eventListeners) {
                        this._off(ev, parts[1]);
                    }
                }
            } else {
                delete this.eventListeners[baseEvent];
            }
        }
    }

    remove() {
        var parent = this.getParent();
        parent &&
            parent.children &&
            (parent.children.splice(this.index, 1),
            parent._setChildrenIndices());
        delete this.parent;
    }

    destroy() {
        var parent = this.getParent(),
            stage = this.getStage(),
            dd = Kinetic.DD,
            global = Kinetic.Global;
        while (this.children && this.children.length > 0) {
            this.children[0].destroy();
        }
        global._removeId(this.getId());
        global._removeName(this.getName(), this._id);
        dd && dd.node && dd.node._id === this._id && dd.node._endDrag();
        this.trans && this.trans.stop();
        this.remove();
    }

    getAttrs() {
        return this.attrs;
    }

    setDefaultAttrs(config) {
        this.attrs === undefined && (this.attrs = {});
        if (config) {
            for (var key in config) {
                this.attrs[key] === undefined &&
                    (this.attrs[key] = config[key]);
            }
        }
    }

    setAttrs(config) {
        if (config) {
            for (var key in config) {
                var setter = "set" + key.charAt(0).toUpperCase() + key.slice(1);
                Kinetic.Type._isFunction(this[setter])
                    ? this[setter](config[key])
                    : this.setAttr(key, config[key]);
            }
        }
    }

    getVisible() {
        var visible = this.attrs.visible,
            parent = this.getParent();
        return visible && parent && !parent.getVisible() ? false : visible;
    }

    getListening() {
        var listening = this.attrs.listening,
            parent = this.getParent();
        return listening && parent && !parent.getListening()
            ? false
            : listening;
    }

    show() {
        this.setVisible(true);
    }

    hide() {
        this.setVisible(false);
    }

    getZIndex() {
        return this.index;
    }

    getAbsoluteZIndex() {
        var self = this;
        function countNodes(nodes) {
            var childNodes = [],
                len = nodes.length;
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                counter++;
                node.nodeType !== "Shape" &&
                    (childNodes = childNodes.concat(node.getChildren()));
                if (node._id === self._id) {
                    i = len;
                }
            }
            childNodes.length > 0 &&
                childNodes[0].getLevel() <= level &&
                countNodes(childNodes);
        }
        var level = this.getLevel(),
            counter = 0;
        if (this.nodeType !== "Stage") {
            countNodes(this.getStage().getChildren());
        }
        return counter;
    }

    getLevel() {
        var level = 0,
            parent = this.parent;
        while (parent) {
            level++;
            parent = parent.parent;
        }
        return level;
    }

    setPosition() {
        var xy = Kinetic.Type._getXY([].slice.call(arguments));
        this.setAttr("x", xy.x);
        this.setAttr("y", xy.y);
    }

    getPosition() {
        var attrs = this.attrs;
        return {
            x: attrs.x,
            y: attrs.y,
        };
    }

    getAbsolutePosition() {
        var transform = this.getAbsoluteTransform(),
            offset = this.getOffset();
        transform.translate(offset.x, offset.y);
        return transform.getTranslation();
    }

    setAbsolutePosition() {
        var xy = Kinetic.Type._getXY([].slice.call(arguments)),
            transformBackup = this._clearTransform();
        this.attrs.x = transformBackup.x;
        this.attrs.y = transformBackup.y;
        delete transformBackup.x;
        delete transformBackup.y;
        var absTransform = this.getAbsoluteTransform();
        absTransform.invert();
        absTransform.translate(xy.x, xy.y);
        var newPos = {
            x: this.attrs.x + absTransform.getTranslation().x,
            y: this.attrs.y + absTransform.getTranslation().y,
        };
        this.setPosition(newPos.x, newPos.y);
        this._setTransform(transformBackup);
    }

    move() {
        var xy = Kinetic.Type._getXY([].slice.call(arguments)),
            x = this.getX(),
            y = this.getY();
        xy.x !== undefined && (x += xy.x);
        xy.y !== undefined && (y += xy.y);
        this.setPosition(x, y);
    }

    _eachAncestorReverse(callback, includeSelf) {
        var ancestors = [],
            parent = this.getParent();
        includeSelf && ancestors.unshift(this);
        while (parent) {
            ancestors.unshift(parent);
            parent = parent.parent;
        }
        var len = ancestors.length;
        for (var i = 0; i < len; i++) {
            callback(ancestors[i]);
        }
    }

    rotate(theta) {
        this.setRotation(this.getRotation() + theta);
    }

    rotateDeg(thetaDeg) {
        this.setRotation(this.getRotation() + Kinetic.Type._degToRad(thetaDeg));
    }

    moveToTop() {
        var idx = this.index;
        this.parent.children.splice(idx, 1);
        this.parent.children.push(this);
        this.parent._setChildrenIndices();
        return true;
    }

    moveUp() {
        var idx = this.index,
            len = this.parent.getChildren().length;
        if (idx < len - 1) {
            this.parent.children.splice(idx, 1);
            this.parent.children.splice(idx + 1, 0, this);
            this.parent._setChildrenIndices();
            return true;
        }
    }

    moveDown() {
        var idx = this.index;
        if (idx > 0) {
            this.parent.children.splice(idx, 1);
            this.parent.children.splice(idx - 1, 0, this);
            this.parent._setChildrenIndices();
            return true;
        }
    }

    moveToBottom() {
        var idx = this.index;
        if (idx > 0) {
            this.parent.children.splice(idx, 1);
            this.parent.children.unshift(this);
            this.parent._setChildrenIndices();
            return true;
        }
    }

    setZIndex(idx) {
        var currentIdx = this.index;
        this.parent.children.splice(currentIdx, 1);
        this.parent.children.splice(idx, 0, this);
        this.parent._setChildrenIndices();
    }

    getAbsoluteOpacity() {
        var opacity = this.getOpacity();
        return (
            this.getParent() &&
                (opacity *= this.getParent().getAbsoluteOpacity()),
            opacity
        );
    }

    moveTo(newParent) {
        this.remove();
        newParent.add(this);
    }

    toObject() {
        var typeHelper = Kinetic.Type,
            obj = {},
            attrs = this.attrs;
        obj.attrs = {};
        for (var key in attrs) {
            var val = attrs[key];
            !typeHelper._isFunction(val) &&
                !typeHelper._isElement(val) &&
                (!typeHelper._isObject(val) || !typeHelper._hasMethods(val)) &&
                (obj.attrs[key] = val);
        }
        obj.nodeType = this.nodeType;
        obj.shapeType = this.shapeType;
        return obj;
    }

    toJSON() {
        return JSON.stringify(this.toObject());
    }

    getParent() {
        return this.parent;
    }

    getLayer() {
        return this.getParent().getLayer();
    }

    getStage() {
        return this.getParent() ? this.getParent().getStage() : undefined;
    }

    simulate(eventType, evt) {
        this._handleEvent(eventType, evt || {});
    }

    fire(eventType, evt) {
        this._executeHandlers(eventType, evt || {});
    }

    getAbsoluteTransform() {
        var transform = new Kinetic.Transform();
        this._eachAncestorReverse(function (ancestor) {
            var t = ancestor.getTransform();
            transform.multiply(t);
        }, true);
        return transform;
    }

    getTransform() {
        var transform = new Kinetic.Transform(),
            attrs = this.attrs,
            x = attrs.x,
            y = attrs.y,
            rotation = attrs.rotation,
            scale = attrs.scale,
            scaleX = scale.x,
            scaleY = scale.y,
            offset = attrs.offset,
            offsetX = offset.x,
            offsetY = offset.y;
        (x !== 0 || y !== 0) && transform.translate(x, y);
        rotation !== 0 && transform.rotate(rotation);
        (scaleX !== 1 || scaleY !== 1) && transform.scale(scaleX, scaleY);
        (offsetX !== 0 || offsetY !== 0) &&
            transform.translate(-1 * offsetX, -1 * offsetY);
        return transform;
    }

    clone(config) {
        var ctorName = this.shapeType || this.nodeType,
            cloned = new Kinetic[ctorName](this.attrs);
        for (var ev in this.eventListeners) {
            var handlers = this.eventListeners[ev],
                len = handlers.length;
            for (var i = 0; i < len; i++) {
                var item = handlers[i];
                item.name.indexOf("kinetic") < 0 &&
                    (cloned.eventListeners[ev] ||
                        (cloned.eventListeners[ev] = []),
                    cloned.eventListeners[ev].push(item));
            }
        }
        cloned.setAttrs(config);
        return cloned;
    }

    toDataURL(config) {
        config = config || {};
        var mimeType = config.mimeType || null,
            quality = config.quality || null,
            canvas,
            context,
            x = config.x || 0,
            y = config.y || 0;
        config.width && config.height
            ? (canvas = new Kinetic.SceneCanvas(config.width, config.height, 1))
            : ((canvas = this.getStage().bufferCanvas), canvas.clear());
        context = canvas.getContext();
        context.save();
        (x || y) && context.translate(-1 * x, -1 * y);
        this.drawScene(canvas);
        context.restore();
        return canvas.toDataURL(mimeType, quality);
    }

    toImage(config) {
        Kinetic.Type._getImage(this.toDataURL(config), function (img) {
            config.callback(img);
        });
    }

    setSize() {
        var size = Kinetic.Type._getSize(Array.prototype.slice.call(arguments));
        this.setWidth(size.width);
        this.setHeight(size.height);
    }

    getSize() {
        return {
            width: this.getWidth(),
            height: this.getHeight(),
        };
    }

    getWidth() {
        return this.attrs.width || 0;
    }

    getHeight() {
        return this.attrs.height || 0;
    }

    _get(selector) {
        return this.nodeType === selector ? [this] : [];
    }

    _off(baseEvent, ns) {
        for (var i = 0; i < this.eventListeners[baseEvent].length; i++) {
            if (this.eventListeners[baseEvent][i].name === ns) {
                this.eventListeners[baseEvent].splice(i, 1);
                if (this.eventListeners[baseEvent].length === 0) {
                    delete this.eventListeners[baseEvent];
                    break;
                }
                i--;
            }
        }
    }

    _clearTransform() {
        var attrs = this.attrs,
            scale = attrs.scale,
            offset = attrs.offset,
            backup = {
                x: attrs.x,
                y: attrs.y,
                rotation: attrs.rotation,
                scale: {
                    x: scale.x,
                    y: scale.y,
                },
                offset: {
                    x: offset.x,
                    y: offset.y,
                },
            };
        this.attrs.x = 0;
        this.attrs.y = 0;
        this.attrs.rotation = 0;
        this.attrs.scale = {
            x: 1,
            y: 1,
        };
        this.attrs.offset = {
            x: 0,
            y: 0,
        };
        return backup;
    }

    _setTransform(backup) {
        for (var key in backup) {
            this.attrs[key] = backup[key];
        }
    }

    _fireBeforeChangeEvent(attr, oldVal, newVal) {
        this._handleEvent("before" + attr.toUpperCase() + "Change", {
            oldVal: oldVal,
            newVal: newVal,
        });
    }

    _fireChangeEvent(attr, oldVal, newVal) {
        this._handleEvent(attr + "Change", {
            oldVal: oldVal,
            newVal: newVal,
        });
    }

    setId(newId) {
        var id = this.getId(),
            global = Kinetic.Global;
        global._removeId(id);
        global._addId(this, newId);
        this.setAttr("id", newId);
    }

    setName(newName) {
        var name = this.getName(),
            global = Kinetic.Global;
        global._removeName(name, this._id);
        global._addName(this, newName);
        this.setAttr("name", newName);
    }

    setAttr(key, val) {
        if (val !== undefined) {
            var oldVal = this.attrs[key];
            this._fireBeforeChangeEvent(key, oldVal, val);
            this.attrs[key] = val;
            this._fireChangeEvent(key, oldVal, val);
        }
    }

    _handleEvent(eventType, evt, nsParent) {
        evt && this.nodeType === "Shape" && (evt.shape = this);
        var listeners = this.eventListeners,
            shouldFire = true;
        if (
            eventType === "mouseenter" &&
            nsParent &&
            this._id === nsParent._id
        ) {
            shouldFire = false;
        } else if (
            eventType === "mouseleave" &&
            nsParent &&
            this._id === nsParent._id
        ) {
            shouldFire = false;
        }
        if (shouldFire) {
            listeners[eventType] && this.fire(eventType, evt);
            if (evt && !evt.cancelBubble && this.parent) {
                if (nsParent && nsParent.parent) {
                    this._handleEvent.call(
                        this.parent,
                        eventType,
                        evt,
                        nsParent.parent,
                    );
                } else {
                    this._handleEvent.call(this.parent, eventType, evt);
                }
            }
        }
    }

    _executeHandlers(eventType, evt) {
        var list = this.eventListeners[eventType],
            len = list.length;
        for (var i = 0; i < len; i++) {
            list[i].handler.apply(this, [evt]);
        }
    }

    isListening() {
        return this.getListening();
    }

    isVisible() {
        return this.getVisible();
    }

    static addSetters(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addSetter(constructor, d);
        }
    }

    static addPointSetters(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addPointSetter(constructor, d);
        }
    }

    static addRotationSetters(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addRotationSetter(constructor, d);
        }
    }

    static addGetters(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addGetter(constructor, d);
        }
    }

    static addRotationGetters(constructor, a) {
        var b = a.length;
        for (var c = 0; c < b; c++) {
            var d = a[c];
            this._addRotationGetter(constructor, d);
        }
    }

    static addGettersSetters(constructor, a) {
        this.addSetters(constructor, a);
        this.addGetters(constructor, a);
    }

    static addPointGettersSetters(constructor, a) {
        this.addPointSetters(constructor, a);
        this.addGetters(constructor, a);
    }

    static addRotationGettersSetters(constructor, a) {
        this.addRotationSetters(constructor, a);
        this.addRotationGetters(constructor, a);
    }

    static _addSetter(constructor, a) {
        var c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function (b) {
            this.setAttr(a, b);
        };
    }

    static _addPointSetter(constructor, a) {
        var c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function () {
            var b = Kinetic.Type._getXY([].slice.call(arguments));
            (b && b.x === undefined && (b.x = this.attrs[a].x),
                b && b.y === undefined && (b.y = this.attrs[a].y),
                this.setAttr(a, b));
        };
    }

    static _addRotationSetter(constructor, a) {
        var c = "set" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function (b) {
            this.setAttr(a, b);
        };
        constructor.prototype[c + "Deg"] = function (b) {
            this.setAttr(a, Kinetic.Type._degToRad(b));
        };
    }

    static _addGetter(constructor, a) {
        var c = "get" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function (b) {
            return this.attrs[a];
        };
    }

    static _addRotationGetter(constructor, a) {
        var c = "get" + a.charAt(0).toUpperCase() + a.slice(1);
        constructor.prototype[c] = function () {
            return this.attrs[a];
        };
        constructor.prototype[c + "Deg"] = function () {
            return Kinetic.Type._radToDeg(this.attrs[a]);
        };
    }

    static create(a, b) {
        return this._createNode(JSON.parse(a), b);
    }

    static _createNode(a, b) {
        var c;
        (a.nodeType === "Shape"
            ? a.shapeType === undefined
                ? (c = "Shape")
                : (c = a.shapeType)
            : (c = a.nodeType),
            b && (a.attrs.container = b));
        var d = new Kinetic[c](a.attrs);
        if (a.children) {
            var e = a.children.length;
            for (var f = 0; f < e; f++) d.add(this._createNode(a.children[f]));
        }
        return d;
    }
};

Kinetic.Node.addGettersSetters(Kinetic.Node, ["x", "y", "opacity"]);
Kinetic.Node.addGetters(Kinetic.Node, ["name", "id"]);
Kinetic.Node.addRotationGettersSetters(Kinetic.Node, ["rotation"]);
Kinetic.Node.addPointGettersSetters(Kinetic.Node, ["scale", "offset"]);
Kinetic.Node.addSetters(Kinetic.Node, [
    "width",
    "height",
    "listening",
    "visible",
]);

for (const name of ["on", "off"]) {
    Kinetic.Collection.prototype[name] = function (...args) {
        this.apply(name, ...args);
    };
}
Kinetic.Container = class extends Kinetic.Node {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Container) {
            this._containerInit(config);
        }
    }

    _containerInit(config) {
        this.children = [];
        this._nodeInit(config);
    }

    getChildren() {
        return this.children;
    }

    removeChildren() {
        while (this.children.length > 0) {
            this.children[0].remove();
        }
    }

    add(child) {
        var children = this.children;
        child.index = children.length;
        child.parent = this;
        children.push(child);
        return this;
    }

    get(selector) {
        var collection = new Kinetic.Collection();
        if (selector.charAt(0) === "#") {
            var node = this._getNodeById(selector.slice(1));
            node && collection.push(node);
        } else if (selector.charAt(0) === ".") {
            var nodes = this._getNodesByName(selector.slice(1));
            Kinetic.Collection.apply(collection, nodes);
        } else {
            var result = [],
                children = this.getChildren(),
                len = children.length;
            for (var i = 0; i < len; i++) {
                result = result.concat(children[i]._get(selector));
            }
            Kinetic.Collection.apply(collection, result);
        }
        return collection;
    }

    _getNodeById(id) {
        var global = Kinetic.Global,
            node = global.ids[id];
        return node !== undefined && this.isAncestorOf(node) ? node : null;
    }

    _getNodesByName(name) {
        var global = Kinetic.Global,
            nodes = global.names[name] || [];
        return this._getDescendants(nodes);
    }

    _get(selector) {
        var result = super._get(selector),
            children = this.getChildren(),
            len = children.length;
        for (var i = 0; i < len; i++) {
            result = result.concat(children[i]._get(selector));
        }
        return result;
    }

    toObject() {
        var obj = super.toObject();
        obj.children = [];
        var children = this.getChildren(),
            len = children.length;
        for (var i = 0; i < len; i++) {
            var child = children[i];
            obj.children.push(child.toObject());
        }
        return obj;
    }

    _getDescendants(list) {
        var descendants = [],
            len = list.length;
        for (var i = 0; i < len; i++) {
            var node = list[i];
            this.isAncestorOf(node) && descendants.push(node);
        }
        return descendants;
    }

    isAncestorOf(node) {
        var parent = node.getParent();
        while (parent) {
            if (parent._id === this._id) return true;
            parent = parent.getParent();
        }
        return false;
    }

    clone(config) {
        var cloned = super.clone(config);
        for (var key in this.children) {
            cloned.add(this.children[key].clone());
        }
        return cloned;
    }

    getIntersections() {
        var xy = Kinetic.Type._getXY(Array.prototype.slice.call(arguments)),
            intersections = [],
            shapes = this.get("Shape"),
            len = shapes.length;
        for (var i = 0; i < len; i++) {
            var shape = shapes[i];
            shape.isVisible() &&
                shape.intersects(xy) &&
                intersections.push(shape);
        }
        return intersections;
    }

    _setChildrenIndices() {
        var children = this.children,
            len = children.length;
        for (var i = 0; i < len; i++) {
            children[i].index = i;
        }
    }

    draw() {
        this.drawScene();
        this.drawHit();
    }

    drawScene(canvas) {
        if (this.isVisible()) {
            var children = this.children,
                len = children.length;
            for (var i = 0; i < len; i++) {
                children[i].drawScene(canvas);
            }
        }
    }

    drawHit() {
        if (this.isVisible() && this.isListening()) {
            var children = this.children,
                len = children.length;
            for (var i = 0; i < len; i++) {
                children[i].drawHit();
            }
        }
    }
};
function defaultShapeFill(context) {
    context.fill();
}

function defaultShapeStroke(context) {
    context.stroke();
}

Kinetic.Shape = class extends Kinetic.Node {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Shape) {
            this._initShape(config);
        }
    }

    _initShape(config) {
        this.setDefaultAttrs({
            fillEnabled: true,
            strokeEnabled: true,
            shadowEnabled: true,
            dashArrayEnabled: true,
            fillPriority: "color",
        });
        this.nodeType = "Shape";
        this._fillFunc = defaultShapeFill;
        this._strokeFunc = defaultShapeStroke;
        this._fillFuncHit = defaultShapeFill;
        this._strokeFuncHit = defaultShapeStroke;
        var shapes = Kinetic.Global.shapes,
            colorKey;
        for (;;) {
            colorKey = Kinetic.Type._getRandomColorKey();
            if (colorKey && !(colorKey in shapes)) break;
        }
        this.colorKey = colorKey;
        shapes[colorKey] = this;

        this._nodeInit(config);
    }

    getContext() {
        return this.getLayer().getContext();
    }

    getCanvas() {
        return this.getLayer().getCanvas();
    }

    hasShadow() {
        return !!(
            this.getShadowColor() ||
            this.getShadowBlur() ||
            this.getShadowOffset()
        );
    }

    hasFill() {
        return !!(
            this.getFill() ||
            this.getFillPatternImage() ||
            this.getFillLinearGradientStartPoint() ||
            this.getFillRadialGradientStartPoint()
        );
    }

    _get(selector) {
        return this.nodeType === selector || this.shapeType === selector
            ? [this]
            : [];
    }

    intersects() {
        var xy = Kinetic.Type._getXY(Array.prototype.slice.call(arguments)),
            stage = this.getStage(),
            hitCanvas = stage.hitCanvas;
        hitCanvas.clear();
        this.drawScene(hitCanvas);
        var pixel = hitCanvas.context.getImageData(
            Math.round(xy.x),
            Math.round(xy.y),
            1,
            1,
        ).data;
        return pixel[3] > 0;
    }

    enableFill() {
        this.setAttr("fillEnabled", true);
    }

    disableFill() {
        this.setAttr("fillEnabled", false);
    }

    enableStroke() {
        this.setAttr("strokeEnabled", true);
    }

    disableStroke() {
        this.setAttr("strokeEnabled", false);
    }

    enableShadow() {
        this.setAttr("shadowEnabled", true);
    }

    disableShadow() {
        this.setAttr("shadowEnabled", false);
    }

    enableDashArray() {
        this.setAttr("dashArrayEnabled", true);
    }

    disableDashArray() {
        this.setAttr("dashArrayEnabled", false);
    }

    remove() {
        super.remove();
        delete Kinetic.Global.shapes[this.colorKey];
    }

    drawScene(canvas) {
        var attrs = this.attrs,
            drawFunc = attrs.drawFunc,
            targetCanvas = canvas || this.getLayer().getCanvas(),
            context = targetCanvas.getContext();
        drawFunc &&
            this.isVisible() &&
            (context.save(),
            targetCanvas._applyOpacity(this),
            targetCanvas._applyLineJoin(this),
            targetCanvas._applyAncestorTransforms(this),
            drawFunc.call(this, targetCanvas),
            context.restore());
    }

    drawHit() {
        var attrs = this.attrs,
            drawHitFunc = attrs.drawHitFunc || attrs.drawFunc,
            hitCanvas = this.getLayer().hitCanvas,
            context = hitCanvas.getContext();
        drawHitFunc &&
            this.isVisible() &&
            this.isListening() &&
            (context.save(),
            hitCanvas._applyLineJoin(this),
            hitCanvas._applyAncestorTransforms(this),
            drawHitFunc.call(this, hitCanvas),
            context.restore());
    }

    _setDrawFuncs() {
        (!this.attrs.drawFunc &&
            this.drawFunc &&
            this.setDrawFunc(this.drawFunc),
            !this.attrs.drawHitFunc &&
                this.drawHitFunc &&
                this.setDrawHitFunc(this.drawHitFunc));
    }
};

Kinetic.Node.addGettersSetters(Kinetic.Shape, [
    "stroke",
    "lineJoin",
    "lineCap",
    "strokeWidth",
    "drawFunc",
    "drawHitFunc",
    "dashArray",
    "shadowColor",
    "shadowBlur",
    "shadowOpacity",
    "fillPatternImage",
    "fill",
    "fillPatternX",
    "fillPatternY",
    "fillLinearGradientColorStops",
    "fillRadialGradientStartRadius",
    "fillRadialGradientEndRadius",
    "fillRadialGradientColorStops",
    "fillPatternRepeat",
    "fillEnabled",
    "strokeEnabled",
    "shadowEnabled",
    "dashArrayEnabled",
    "fillPriority",
]);
Kinetic.Node.addPointGettersSetters(Kinetic.Shape, [
    "fillPatternOffset",
    "fillPatternScale",
    "fillLinearGradientStartPoint",
    "fillLinearGradientEndPoint",
    "fillRadialGradientStartPoint",
    "fillRadialGradientEndPoint",
    "shadowOffset",
]);
Kinetic.Node.addRotationGettersSetters(Kinetic.Shape, ["fillPatternRotation"]);
Kinetic.Stage = class extends Kinetic.Container {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Stage) {
            this._initStage(config);
        }
    }

    _initStage(config) {
        var dd = Kinetic.DD;
        this.setDefaultAttrs({
            width: 400,
            height: 200,
        });
        this._containerInit(config);
        this._setStageDefaultProperties();
        this._id = Kinetic.Global.idCounter++;
        this._buildDOM();
        this._bindContentEvents();
        Kinetic.Global.stages.push(this);
        dd && dd._initDragLayer(this);
    }

    setContainer(container) {
        if (typeof container === "string") {
            container = document.getElementById(container);
        }
        this.setAttr("container", container);
    }

    setHeight(height) {
        super.setHeight(height);
        this._resizeDOM();
    }

    setWidth(width) {
        super.setWidth(width);
        this._resizeDOM();
    }

    clear() {
        var children = this.children,
            len = children.length;
        for (var i = 0; i < len; i++) {
            children[i].clear();
        }
    }

    remove() {
        var content = this.content;
        super.remove();
        content &&
            Kinetic.Type._isInDocument(content) &&
            this.attrs.container.removeChild(content);
    }

    reset() {
        this.removeChildren();
        this._setStageDefaultProperties();
        this.setAttrs(this.defaultNodeAttrs);
    }

    getMousePosition() {
        return this.mousePos;
    }

    getTouchPosition() {
        return this.touchPos;
    }

    getUserPosition() {
        return this.getTouchPosition() || this.getMousePosition();
    }

    getStage() {
        return this;
    }

    getContent() {
        return this.content;
    }

    toDataURL(config) {
        var self = this;
        function loadAndDrawImage(idx) {
            var layer = layers[idx],
                url = layer.toDataURL(),
                img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
                if (idx < layers.length - 1) {
                    loadAndDrawImage(idx + 1);
                } else {
                    config.callback(canvas.toDataURL(mimeType, quality));
                }
            };
            img.src = url;
        }
        config = config || {};
        var mimeType = config.mimeType || null,
            quality = config.quality || null,
            x = config.x || 0,
            y = config.y || 0,
            canvas = new Kinetic.SceneCanvas(
                config.width || this.getWidth(),
                config.height || this.getHeight(),
            ),
            ctx = canvas.getContext(),
            layers = this.children;
        (x || y) && ctx.translate(-1 * x, -1 * y);
        loadAndDrawImage(0);
    }

    toImage(config) {
        var callback = config.callback;
        config.callback = function (url) {
            Kinetic.Type._getImage(url, function (img) {
                callback(img);
            });
        };
        this.toDataURL(config);
    }

    getIntersection(xy) {
        var children = this.getChildren(),
            len = children.length;
        for (var i = len - 1; i >= 0; i--) {
            var layer = children[i];
            if (layer.isVisible() && layer.isListening()) {
                var pixel = layer.hitCanvas.context.getImageData(
                    Math.round(xy.x),
                    Math.round(xy.y),
                    1,
                    1,
                ).data;
                if (pixel[3] === 255) {
                    var shape =
                        Kinetic.Global.shapes[
                            Kinetic.Type._rgbToHex(pixel[0], pixel[1], pixel[2])
                        ];
                    return {
                        shape: shape,
                        pixel: pixel,
                    };
                }
                if (
                    pixel[0] > 0 ||
                    pixel[1] > 0 ||
                    pixel[2] > 0 ||
                    pixel[3] > 0
                ) {
                    return {
                        pixel: pixel,
                    };
                }
            }
        }
        return null;
    }

    _resizeDOM() {
        if (this.content) {
            var w = this.attrs.width,
                h = this.attrs.height;
            this.content.style.width = w + "px";
            this.content.style.height = h + "px";
            this.bufferCanvas.setSize(w, h, 1);
            this.hitCanvas.setSize(w, h);
            var children = this.children,
                len = children.length;
            for (var i = 0; i < len; i++) {
                var layer = children[i];
                layer.getCanvas().setSize(w, h);
                layer.hitCanvas.setSize(w, h);
                layer.draw();
            }
        }
    }

    add(layer) {
        super.add(layer);
        layer.canvas.setSize(this.attrs.width, this.attrs.height);
        layer.hitCanvas.setSize(this.attrs.width, this.attrs.height);
        layer.draw();
        this.content.appendChild(layer.canvas.element);
        return this;
    }

    getDragLayer() {
        return this.dragLayer;
    }

    _setUserPosition(evt) {
        evt = evt || window.event;
        this._setMousePosition(evt);
        this._setTouchPosition(evt);
    }

    _bindContentEvents() {
        var self = this,
            events = [
                "mousedown",
                "mousemove",
                "mouseup",
                "mouseout",
                "touchstart",
                "touchmove",
                "touchend",
            ],
            len = events.length;
        for (var i = 0; i < len; i++) {
            var ev = events[i];
            (function () {
                var eventName = ev;
                self.content.addEventListener(
                    eventName,
                    function (e) {
                        self["_" + eventName](e);
                    },
                    false,
                );
            })();
        }
    }

    _mouseout(evt) {
        this._setUserPosition(evt);
        var dd = Kinetic.DD,
            target = this.targetShape;
        target &&
            (!dd || !dd.moving) &&
            (target._handleEvent("mouseout", evt),
            target._handleEvent("mouseleave", evt),
            (this.targetShape = null));
        this.mousePos = undefined;
    }

    _mousemove(evt) {
        this._setUserPosition(evt);
        var dd = Kinetic.DD,
            intersection = this.getIntersection(this.getUserPosition());
        if (intersection) {
            var shape = intersection.shape;
            shape &&
                ((dd && dd.moving) ||
                intersection.pixel[3] !== 255 ||
                (this.targetShape && this.targetShape._id === shape._id)
                    ? shape._handleEvent("mousemove", evt)
                    : (this.targetShape &&
                          (this.targetShape._handleEvent(
                              "mouseout",
                              evt,
                              shape,
                          ),
                          this.targetShape._handleEvent(
                              "mouseleave",
                              evt,
                              shape,
                          )),
                      shape._handleEvent("mouseover", evt, this.targetShape),
                      shape._handleEvent("mouseenter", evt, this.targetShape),
                      (this.targetShape = shape)));
        } else {
            this.targetShape &&
                (!dd || !dd.moving) &&
                (this.targetShape._handleEvent("mouseout", evt),
                this.targetShape._handleEvent("mouseleave", evt),
                (this.targetShape = null));
        }
        dd && dd._drag(evt);
    }

    _mousedown(evt) {
        var dd = Kinetic.DD;
        this._setUserPosition(evt);
        var intersection = this.getIntersection(this.getUserPosition());
        if (intersection && intersection.shape) {
            var shape = intersection.shape;
            this.clickStart = true;
            shape._handleEvent("mousedown", evt);
        }
        dd && this.attrs.draggable && !dd.node && this._startDrag(evt);
    }

    _mouseup(evt) {
        this._setUserPosition(evt);
        var self = this,
            dd = Kinetic.DD,
            intersection = this.getIntersection(this.getUserPosition());
        if (intersection && intersection.shape) {
            var shape = intersection.shape;
            shape._handleEvent("mouseup", evt);
            this.clickStart &&
                (!dd || !dd.moving || !dd.node) &&
                (shape._handleEvent("click", evt),
                this.inDoubleClickWindow && shape._handleEvent("dblclick", evt),
                (this.inDoubleClickWindow = true),
                setTimeout(function () {
                    self.inDoubleClickWindow = false;
                }, this.dblClickWindow));
        }
        this.clickStart = false;
    }

    _touchstart(evt) {
        var dd = Kinetic.DD;
        this._setUserPosition(evt);
        evt.preventDefault();
        var intersection = this.getIntersection(this.getUserPosition());
        if (intersection && intersection.shape) {
            var shape = intersection.shape;
            this.tapStart = true;
            shape._handleEvent("touchstart", evt);
        }
        dd && this.attrs.draggable && !dd.node && this._startDrag(evt);
    }

    _touchend(evt) {
        this._setUserPosition(evt);
        var self = this,
            dd = Kinetic.DD,
            intersection = this.getIntersection(this.getUserPosition());
        if (intersection && intersection.shape) {
            var shape = intersection.shape;
            shape._handleEvent("touchend", evt);
            this.tapStart &&
                (!dd || !dd.moving || !dd.node) &&
                (shape._handleEvent("tap", evt),
                this.inDoubleClickWindow && shape._handleEvent("dbltap", evt),
                (this.inDoubleClickWindow = true),
                setTimeout(function () {
                    self.inDoubleClickWindow = false;
                }, this.dblClickWindow));
        }
        this.tapStart = false;
    }

    _touchmove(evt) {
        this._setUserPosition(evt);
        var dd = Kinetic.DD;
        evt.preventDefault();
        var intersection = this.getIntersection(this.getUserPosition());
        if (intersection && intersection.shape) {
            var shape = intersection.shape;
            shape._handleEvent("touchmove", evt);
        }
        dd && dd._drag(evt);
    }

    _setMousePosition(evt) {
        var x = evt.clientX - this._getContentPosition().left,
            y = evt.clientY - this._getContentPosition().top;
        this.mousePos = {
            x: x,
            y: y,
        };
    }

    _setTouchPosition(evt) {
        if (evt.touches !== undefined && evt.touches.length === 1) {
            var touch = evt.touches[0],
                x = touch.clientX - this._getContentPosition().left,
                y = touch.clientY - this._getContentPosition().top;
            this.touchPos = {
                x: x,
                y: y,
            };
        }
    }

    _getContentPosition() {
        var rect = this.content.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
        };
    }

    _buildDOM() {
        this.content = document.createElement("div");
        this.content.style.position = "relative";
        this.content.style.display = "inline-block";
        this.content.className = "kineticjs-content";
        this.attrs.container.appendChild(this.content);
        this.bufferCanvas = new Kinetic.SceneCanvas();
        this.hitCanvas = new Kinetic.HitCanvas();
        this._resizeDOM();
    }

    _onContent(evtStr, handler) {
        var events = evtStr.split(" "),
            len = events.length;
        for (var i = 0; i < len; i++) {
            var ev = events[i];
            this.content.addEventListener(ev, handler, false);
        }
    }

    _setStageDefaultProperties() {
        this.nodeType = "Stage";
        this.dblClickWindow = 400;
        this.targetShape = null;
        this.mousePos = undefined;
        this.clickStart = false;
        this.touchPos = undefined;
        this.tapStart = false;
    }
};

Kinetic.Node.addGetters(Kinetic.Stage, ["container"]);
Kinetic.Layer = class extends Kinetic.Container {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Layer) {
            this._initLayer(config);
        }
    }

    _initLayer(config) {
        this.setDefaultAttrs({
            clearBeforeDraw: true,
        });
        this.nodeType = "Layer";
        this.beforeDrawFunc = undefined;
        this.afterDrawFunc = undefined;
        this.canvas = new Kinetic.SceneCanvas();
        this.canvas.getElement().style.position = "absolute";
        this.hitCanvas = new Kinetic.HitCanvas();
        this._containerInit(config);
    }

    draw() {
        var ctx = this.getContext();
        this.beforeDrawFunc !== undefined && this.beforeDrawFunc.call(this);
        super.draw();
        this.afterDrawFunc !== undefined && this.afterDrawFunc.call(this);
    }

    drawHit() {
        this.hitCanvas.clear();
        super.drawHit();
    }

    drawScene(canvas) {
        var targetCanvas = canvas || this.getCanvas();
        this.attrs.clearBeforeDraw && targetCanvas.clear();
        super.drawScene(targetCanvas);
    }

    toDataURL(config) {
        config = config || {};
        var mimeType = config.mimeType || null,
            quality = config.quality || null;
        return config.width || config.height || config.x || config.y
            ? super.toDataURL(config)
            : this.getCanvas().toDataURL(mimeType, quality);
    }

    beforeDraw(handler) {
        this.beforeDrawFunc = handler;
    }

    afterDraw(handler) {
        this.afterDrawFunc = handler;
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.canvas.context;
    }

    clear() {
        this.getCanvas().clear();
    }

    setVisible(visible) {
        super.setVisible(visible);
        if (visible) {
            this.canvas.element.style.display = "block";
            this.hitCanvas.element.style.display = "block";
        } else {
            this.canvas.element.style.display = "none";
            this.hitCanvas.element.style.display = "none";
        }
    }

    setZIndex(idx) {
        super.setZIndex(idx);
        var stage = this.getStage();
        if (stage) {
            stage.content.removeChild(this.canvas.element);
            idx < stage.getChildren().length - 1
                ? stage.content.insertBefore(
                      this.canvas.element,
                      stage.getChildren()[idx + 1].canvas.element,
                  )
                : stage.content.appendChild(this.canvas.element);
        }
    }

    moveToTop() {
        super.moveToTop();
        var stage = this.getStage();
        stage &&
            (stage.content.removeChild(this.canvas.element),
            stage.content.appendChild(this.canvas.element));
    }

    moveUp() {
        if (super.moveUp()) {
            var stage = this.getStage();
            stage &&
                (stage.content.removeChild(this.canvas.element),
                this.index < stage.getChildren().length - 1
                    ? stage.content.insertBefore(
                          this.canvas.element,
                          stage.getChildren()[this.index + 1].canvas.element,
                      )
                    : stage.content.appendChild(this.canvas.element));
        }
    }

    moveDown() {
        if (super.moveDown()) {
            var stage = this.getStage();
            if (stage) {
                var children = stage.getChildren();
                stage.content.removeChild(this.canvas.element);
                stage.content.insertBefore(
                    this.canvas.element,
                    children[this.index + 1].canvas.element,
                );
            }
        }
    }

    moveToBottom() {
        if (super.moveToBottom()) {
            var stage = this.getStage();
            if (stage) {
                var children = stage.getChildren();
                stage.content.removeChild(this.canvas.element);
                stage.content.insertBefore(
                    this.canvas.element,
                    children[1].canvas.element,
                );
            }
        }
    }

    getLayer() {
        return this;
    }

    remove() {
        var stage = this.getStage(),
            canvas = this.canvas,
            element = canvas.element;
        super.remove();
        stage &&
            canvas &&
            Kinetic.Type._isInDocument(element) &&
            stage.content.removeChild(element);
    }
};

Kinetic.Node.addGettersSetters(Kinetic.Layer, ["clearBeforeDraw"]);
// --- Group ---
Kinetic.Group = class extends Kinetic.Container {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Group) {
            this._initGroup(config);
        }
    }
    _initGroup(config) {
        this.nodeType = "Group";
        this._containerInit(config);
    }
};
// --- Rect ---
Kinetic.Rect = class extends Kinetic.Shape {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Rect) {
            this._initRect(config);
        }
    }

    _initRect(config) {
        this.setDefaultAttrs({
            width: 0,
            height: 0,
            cornerRadius: 0,
        });
        this._initShape(config);
        this.shapeType = "Rect";
        this._setDrawFuncs();
    }

    drawFunc(canvas) {
        var context = canvas.getContext();
        context.beginPath();

        var cornerRadius = this.getCornerRadius(),
            width = this.getWidth(),
            height = this.getHeight();

        if (cornerRadius === 0) {
            context.rect(0, 0, width, height);
        } else {
            context.moveTo(cornerRadius, 0);
            context.lineTo(width - cornerRadius, 0);
            context.arc(
                width - cornerRadius,
                cornerRadius,
                cornerRadius,
                (Math.PI * 3) / 2,
                0,
                false,
            );
            context.lineTo(width, height - cornerRadius);
            context.arc(
                width - cornerRadius,
                height - cornerRadius,
                cornerRadius,
                0,
                Math.PI / 2,
                false,
            );
            context.lineTo(cornerRadius, height);
            context.arc(
                cornerRadius,
                height - cornerRadius,
                cornerRadius,
                Math.PI / 2,
                Math.PI,
                false,
            );
            context.lineTo(0, cornerRadius);
            context.arc(
                cornerRadius,
                cornerRadius,
                cornerRadius,
                Math.PI,
                (Math.PI * 3) / 2,
                false,
            );
        }
        context.closePath();
        canvas.fillStroke(this);
    }
};

Kinetic.Node.addGettersSetters(Kinetic.Rect, ["cornerRadius"]);
function defaultTextFill(context) {
    context.fillText(this.partialText, 0, 0);
}

function defaultTextStroke(context) {
    context.strokeText(this.partialText, 0, 0);
}
Kinetic.Text = class extends Kinetic.Shape {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Text) {
            this._initText(config);
        }
    }

    _initText(config) {
        var self = this;
        this.setDefaultAttrs({
            fontFamily: "Calibri",
            text: "",
            fontSize: 12,
            align: "left",
            verticalAlign: "top",
            fontStyle: "normal",
            padding: 0,
            width: "auto",
            height: "auto",
            lineHeight: 1,
        });
        this.dummyCanvas = document.createElement("canvas");
        this._initShape(config);
        this._fillFunc = defaultTextFill;
        this._strokeFunc = defaultTextStroke;
        this.shapeType = "Text";
        this._setDrawFuncs();
        const textChangeEvents = [
            "fontFamily",
            "fontSize",
            "fontStyle",
            "padding",
            "align",
            "lineHeight",
            "text",
            "width",
            "height",
        ];
        for (let i = 0; i < textChangeEvents.length; i++) {
            this.on(textChangeEvents[i] + "Change.kinetic", self._setTextData);
        }
        this._setTextData();
    }

    drawFunc(canvas) {
        var context = canvas.getContext(),
            padding = this.getPadding(),
            fontStyle = this.getFontStyle(),
            fontSize = this.getFontSize(),
            fontFamily = this.getFontFamily(),
            textHeight = this.getTextHeight(),
            lineHeight = this.getLineHeight() * textHeight,
            textArr = this.textArr,
            len = textArr.length,
            width = this.getWidth();

        context.font = fontStyle + " " + fontSize + "px " + fontFamily;
        context.textBaseline = "middle";
        context.textAlign = "left";
        context.save();
        context.translate(padding, 0);
        context.translate(0, padding + textHeight / 2);

        for (var n = 0; n < len; n++) {
            var pNode = textArr[n],
                lineText = pNode.text,
                lineWidth = pNode.width;

            context.save();
            if (this.getAlign() === "right") {
                context.translate(width - lineWidth - padding * 2, 0);
            } else if (this.getAlign() === "center") {
                context.translate((width - lineWidth - padding * 2) / 2, 0);
            }
            this.partialText = lineText;
            canvas.fillStroke(this);
            context.restore();
            context.translate(0, lineHeight);
        }
        context.restore();
    }

    drawHitFunc(canvas) {
        var context = canvas.getContext(),
            width = this.getWidth(),
            height = this.getHeight();
        context.beginPath();
        context.rect(0, 0, width, height);
        context.closePath();
        canvas.fillStroke(this);
    }

    setText(text) {
        var textStr = Kinetic.Type._isString(text) ? text : text.toString();
        this.setAttr("text", textStr);
    }

    getTextWidth() {
        return this.textWidth;
    }

    getTextHeight() {
        return this.textHeight;
    }

    _getTextSize(text) {
        var canvas = this.dummyCanvas,
            context = canvas.getContext("2d"),
            fontSize = this.getFontSize(),
            metrics;
        context.save();
        context.font =
            this.getFontStyle() + " " + fontSize + "px " + this.getFontFamily();
        metrics = context.measureText(text);
        context.restore();
        return {
            width: metrics.width,
            height: parseInt(fontSize, 10),
        };
    }

    _getTextSizeSkipContext(text) {
        var canvas = this.dummyCanvas,
            context = canvas.getContext("2d"),
            fontSize = this.getFontSize(),
            metrics;
        context.font =
            this.getFontStyle() + " " + fontSize + "px " + this.getFontFamily();
        metrics = context.measureText(text);
        return {
            width: metrics.width,
            height: parseInt(fontSize, 10),
        };
    }

    _expandTextData(lines) {
        var len = lines.length,
            i = 0,
            lineText = "",
            expandedLines = [];
        for (i = 0; i < len; i++) {
            lineText = lines[i];
            expandedLines.push({
                text: lineText,
                width: this._getTextSize(lineText).width,
            });
        }
        return expandedLines;
    }

    _setTextData() {
        this.dummyCanvas.getContext("2d").save();
        var words = this.getText().split(""),
            lines = [],
            lineCount = 0,
            addLine = true,
            lineHeightPx = 0,
            padding = this.getPadding();
        this.textWidth = 0;
        this.textHeight = this._getTextSizeSkipContext(this.getText()).height;
        lineHeightPx = this.getLineHeight() * this.textHeight;

        while (
            words.length > 0 &&
            addLine &&
            (this.attrs.height === "auto" ||
                lineHeightPx * (lineCount + 1) <
                    this.attrs.height - padding * 2)
        ) {
            var wordIndex = 0,
                lineText = undefined;
            addLine = false;
            while (wordIndex < words.length) {
                if (words.indexOf("\n") === wordIndex) {
                    words.splice(wordIndex, 1);
                    lineText = words.splice(0, wordIndex).join("");
                    break;
                }
                var currentWords = words.slice(0, wordIndex);
                if (
                    this.attrs.width !== "auto" &&
                    this._getTextSizeSkipContext(currentWords.join("")).width >
                        this.attrs.width - padding * 2
                ) {
                    if (wordIndex == 0) break;
                    var lastSpace = currentWords.lastIndexOf(" "),
                        lastNewline = currentWords.lastIndexOf("\n"),
                        maxBreakIdx = Math.max(lastSpace, lastNewline);
                    if (maxBreakIdx >= 0) {
                        lineText = words.splice(0, 1 + maxBreakIdx).join("");
                        break;
                    }
                    lineText = words.splice(0, wordIndex).join("");
                    break;
                }
                wordIndex++;
                if (wordIndex === words.length) {
                    lineText = words.splice(0, wordIndex).join("");
                }
            }
            this.textWidth = Math.max(
                this.textWidth,
                this._getTextSizeSkipContext(lineText).width,
            );
            if (lineText !== undefined) {
                lines.push(lineText);
                addLine = true;
            }
            lineCount++;
        }
        this.textArr = this._expandTextData(lines);
        this.dummyCanvas.getContext("2d").restore();
    }

    getWidth() {
        return this.attrs.width === "auto"
            ? this.getTextWidth() + this.getPadding() * 2
            : this.attrs.width;
    }

    getHeight() {
        return this.attrs.height === "auto"
            ? this.getTextHeight() *
                  this.textArr.length *
                  this.attrs.lineHeight +
                  this.attrs.padding * 2
            : this.attrs.height;
    }
};

Kinetic.Node.addGettersSetters(Kinetic.Text, [
    "fontFamily",
    "fontSize",
    "fontStyle",
    "padding",
    "align",
    "lineHeight",
]);
Kinetic.Node.addGetters(Kinetic.Text, ["text"]);
// --- Line ---
Kinetic.Line = class extends Kinetic.Shape {
    constructor(config) {
        super(config);
        if (this.constructor === Kinetic.Line) {
            this._initLine(config);
        }
    }

    _initLine(config) {
        this.setDefaultAttrs({
            points: [],
            lineCap: "butt",
        });
        this._initShape(config);
        this.shapeType = "Line";
        this._setDrawFuncs();
    }

    drawFunc(canvas) {
        var points = this.getPoints(),
            length = points.length,
            context = canvas.getContext();
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < length; i++) {
            var point = points[i];
            context.lineTo(point.x, point.y);
        }
        canvas.stroke(this);
    }

    setPoints(points) {
        this.setAttr("points", Kinetic.Type._getPoints(points));
    }
};

Kinetic.Global.extend(Kinetic.Line, Kinetic.Shape);
Kinetic.Node.addGetters(Kinetic.Line, ["points"]);

export default Kinetic;
export { Kinetic };
