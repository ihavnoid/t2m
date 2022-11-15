d3 = function() {
  var π = Math.PI, ε = 1e-6, d3 = {
    version: "3.0.8"
  }, d3_radians = π / 180, d3_degrees = 180 / π, d3_document = document, d3_window = window;
  function d3_target(d) {
    return d.target;
  }
  function d3_source(d) {
    return d.source;
  }
  var d3_format_decimalPoint = ".", d3_format_thousandsSeparator = ",", d3_format_grouping = [ 3, 3 ];
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  try {
    d3_document.createElement("div").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
  function d3_class(ctor, properties) {
    try {
      for (var key in properties) {
        Object.defineProperty(ctor.prototype, key, {
          value: properties[key],
          enumerable: false
        });
      }
    } catch (e) {
      ctor.prototype = properties;
    }
  }
  d3.map = function(object) {
    var map = new d3_Map();
    for (var key in object) map.set(key, object[key]);
    return map;
  };
  function d3_Map() {}
  d3_class(d3_Map, {
    has: function(key) {
      return d3_map_prefix + key in this;
    },
    get: function(key) {
      return this[d3_map_prefix + key];
    },
    set: function(key, value) {
      return this[d3_map_prefix + key] = value;
    },
    remove: function(key) {
      key = d3_map_prefix + key;
      return key in this && delete this[key];
    },
    keys: function() {
      var keys = [];
      this.forEach(function(key) {
        keys.push(key);
      });
      return keys;
    },
    values: function() {
      var values = [];
      this.forEach(function(key, value) {
        values.push(value);
      });
      return values;
    },
    entries: function() {
      var entries = [];
      this.forEach(function(key, value) {
        entries.push({
          key: key,
          value: value
        });
      });
      return entries;
    },
    forEach: function(f) {
      for (var key in this) {
        if (key.charCodeAt(0) === d3_map_prefixCode) {
          f.call(this, key.substring(1), this[key]);
        }
      }
    }
  });
  var d3_map_prefix = "\0", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  var d3_timer_id = 0, d3_timer_byId = {}, d3_timer_queue = null, d3_timer_interval, d3_timer_timeout;
  d3.timer = function(callback, delay, then) {
    if (arguments.length < 3) {
      if (arguments.length < 2) delay = 0; else if (!isFinite(delay)) return;
      then = Date.now();
    }
    var timer = d3_timer_byId[callback.id];
    if (timer && timer.callback === callback) {
      timer.then = then;
      timer.delay = delay;
    } else d3_timer_byId[callback.id = ++d3_timer_id] = d3_timer_queue = {
      callback: callback,
      then: then,
      delay: delay,
      next: d3_timer_queue
    };
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var elapsed, now = Date.now(), t1 = d3_timer_queue;
    while (t1) {
      elapsed = now - t1.then;
      if (elapsed >= t1.delay) t1.flush = t1.callback(elapsed);
      t1 = t1.next;
    }
    var delay = d3_timer_flush() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    var elapsed, now = Date.now(), t1 = d3_timer_queue;
    while (t1) {
      elapsed = now - t1.then;
      if (!t1.delay) t1.flush = t1.callback(elapsed);
      t1 = t1.next;
    }
    d3_timer_flush();
  };
  function d3_timer_flush() {
    var t0 = null, t1 = d3_timer_queue, then = Infinity;
    while (t1) {
      if (t1.flush) {
        delete d3_timer_byId[t1.callback.id];
        t1 = t0 ? t0.next = t1.next : d3_timer_queue = t1.next;
      } else {
        then = Math.min(then, t1.then + t1.delay);
        t1 = (t0 = t1).next;
      }
    }
    return then;
  }
  var d3_timer_frame = d3_window.requestAnimationFrame || d3_window.webkitRequestAnimationFrame || d3_window.mozRequestAnimationFrame || d3_window.oRequestAnimationFrame || d3_window.msRequestAnimationFrame || function(callback) {
    setTimeout(callback, 17);
  };

  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i > 0) {
      name = type.substring(i + 1);
      type = type.substring(0, i);
    }
    return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }

  d3.layout = {};
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, gravity = .1, theta = .8, nodes = [], links = [], distances, strengths, charges;
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
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
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;

      nodes.forEach((x) => { x.intersects = false; })
      for(i=0; i<m; ++i) {
        for(j=i+1; j<m; ++j) {
          if(links[i].source == links[j].source || 
                links[i].source == links[j].target || 
                links[i].target == links[j].source || 
                links[i].target == links[j].target) {
              continue;
          }

          if(links_intersect(links[i], links[j])) {
            if(!links[i].source.fixed) {
                let vx = links[i].target.y - links[i].source.y
                let vy = links[i].source.x - links[i].target.x
                let ox = links[j].source.x - links[i].source.x
                let oy = links[j].source.y - links[i].source.y
                if(vx*vy + ox*oy > 0) {
                  vx = -vx; vy = -vy;
                }
                let l = Math.sqrt(vx*vx + vy * vy)
                vx = vx / l * 2;
                vy = vy / l * 2;
                links[i].source.vx += vx;
                links[i].source.vy += vy;
            }
            if(!links[j].source.fixed) {
                let vx = links[j].target.y - links[j].source.y
                let vy = links[j].source.x - links[j].target.x
                let ox = links[i].source.x - links[j].source.x
                let oy = links[i].source.y - links[j].source.y
                if(vx*vy + ox*oy > 0) {
                  vx = -vx; vy = -vy;
                }
                let l = Math.sqrt(vx*vx + vy * vy)
                vx = vx / l * 2;
                vy = vy / l * 2;
                links[j].source.vx += vx;
                links[j].source.vy += vy;
            }
            links[i].source.intersects = true;
            links[j].source.intersects = true;
          }
        }
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if(o.distance === undefined) {
            o.distance = distances[i];
        }
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        l = x * x + y * y;
        if (l) {
          l = Math.sqrt(l);
          let bx1 = (s.w + t.w)/2
          let by1 = bx1 * y / (x + 1e-6)
          let by2 = (s.h + t.h)/2
          let bx2 = by2 * x / (y + 1e-6)
          l -= Math.sqrt(Math.min(bx1 * bx1 + by1 * by1, bx2 * bx2 + by2 * by2))
          if(l < o.distance/4) l = o.distance/4;
          l = alpha * strengths[i] * (l - o.distance) / l;
          o.distance += l * 0.1;
          x *= l;
          y *= l;
          k = s.weight / (t.weight + s.weight);
          t.x -= x * k;
          t.y -= y * k;
          s.x += x * (1 - k);
          s.y += y * (1 - k);
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
          o.x += (o.vx = o.vx * .75) / 3;
          o.y += (o.vy = o.vy * .75) / 3;
        }
      }
      for(var i=0; i<nodes.length; i++) {
        for(var j=i+1; j<nodes.length; j++) {
            // node repulsion force.  proportional to topographical distance between nodes (max 10)
            var n1 = nodes[i], n2 = nodes[j]
            function distance_between(n1, n2) {
                let dist = 0;
                while(dist < 10 && (n1.data.parent || n2.data.parent)) {
                    if(n1 == n2) { return dist; }
                    else if(n1.data.level > n2.data.level) {
                        n1 = n1.data.parent;
                    } else {
                        n2 = n2.data.parent;
                    }
                    dist++;
                }
                return 10;
            }
            let distance = distance_between(n1, n2);
            var w = (n1.w + n2.w) / 2 * (1-alpha) + 10
            var h = (n1.h + n2.h) / 2 * (1-alpha) + 10
            var dx = n1.x - n2.x
            var dy = n1.y - n2.y
            var rx = dx / w
            var ry = dy / h

            var l = (dx * dx + dy * dy) + 1; // prevent divide-by-zero
            var sx = dx / l * (distance - 1);
            var sy = dy / l * (distance - 1);
            // note : weight can be zero
            if(!n1.fixed) {
                n1.py += sy / (n1.weight+1)
                n1.y += sy / (n1.weight+1)
                n1.px += sx / (n1.weight+1)
                n1.x += sx / (n1.weight+1)
            }
            if(!n2.fixed) {
                n2.py -= sy / (n2.weight+1)
                n2.y -= sy / (n2.weight+1)
                n2.px -= sx / (n2.weight+1)
                n2.x -= sx / (n2.weight+1)
            }                     
          }
      }

      // console.log(alpha)
      for(var a = 0.2; a > alpha; a = a * 0.92) {
          // collision correction - TBD
          for(var i=0; i<nodes.length; i++) {
              for(var j=i+1; j<nodes.length; j++) {
                  if(n1.intersects && n2.intersects) { continue; }
                  var n1 = nodes[i], n2 = nodes[j]
                  var w = (n1.w + n2.w) / 2 * (1 - alpha) + 10;
                  var h = (n1.h + n2.h) / 2 * (1 - alpha) + 10;
                  var dx = n1.x - n2.x
                  var dy = n1.y - n2.y
                  var rx = dx / w
                  var ry = dy / h

                  if(Math.abs(rx) < 1 && Math.abs(ry) < 1) {
                    if(Math.abs(rx) > Math.abs(ry)) {
                      if(Math.abs(rx) < 0.4) {
                        rx = rx > 0 ? 0.4 :-0.4
                      }
                      var sx = w / rx * 0.003
                      if(!n1.fixed) {
                          n1.px += sx
                          n1.x += sx
                      }
                      if(!n2.fixed) {
                          n2.px -= sx
                          n2.x -= sx
                      }
                    } else {
                      if(Math.abs(ry) < 0.4) {
                        ry = ry > 0 ? 0.4 :-0.4
                      }
                      var sy = h / ry * 0.003
                      if(!n1.fixed) {
                          n1.py += sy
                          n1.y += sy
                      }
                      if(!n2.fixed) {
                          n2.py -= sy
                          n2.y -= sy
                      }
                    }
                  }
              }
           }
      }


      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return theta;
      theta = +x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, j, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
        if (isNaN(o.w)) o.w = 1;
        if (isNaN(o.h)) o.h = 1;
        if (isNaN(o.vx)) o.vx = 0;
        if (isNaN(o.vy)) o.vy = 0; 
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        var neighbors = neighbor(i), j = -1, m = neighbors.length, x;
        while (++j < m) if (!isNaN(x = neighbors[j][dimension])) return x;
        return Math.random() * size;
      }
      function neighbor() {
        if (!neighbors) {
          neighbors = [];
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        return neighbors[i];
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1;
  return d3;
}();
