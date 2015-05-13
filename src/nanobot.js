var _ = require('underscore');
var t = require('traverse');
var _objwriter = require('./objwriter');

/*
 * Clones returns a function which will deep-clone an object, except
 * that everywhere in the object it finds a function it will
 * substitute an invocation of the function for the function
 * itself. The idea is that a template object can be strategically
 * populated with generator functions which can then be used to create
 * mountainous volumes of controllable-variant clones.
 *
 * Eg:
 * var oid = 0;
 * var obj = { id: function() { return ++oid; } };
 * var nanobot = Clones(obj);
 * var clones = [];
 * _.times(100, clones.push(nanobot()));
 *
 * clones == [{id:1}, {id:2}, ..., {id:100}]
 */
var Clones = function(obj) {
   var o = new t(obj);
   return function() {
      return o.map(function(node) {
         if(typeof node == 'function') {
            this.update(node(),true);
         }
         else return node;
      });
   }
};

/*
 * A generator is a function which produces a value when called.
 * Array generators generate arrays, Number generators generate
 * numbers, etc.
 *
 * Generator factories produce generators based on some sort of
 * config such as a distribution over an underlying set, a flavor of
 * random or semi-random values, or a deterministic sequence.
 *
 */
var Factory = {
   Set: {
      maker: makeSet,
   },
   Array: {
      maker: makeArr,
   },
   Object: {
      maker: makeObj,
      cloner: Clones,
   },
   Number: {
      sin: function(step,start) { return stepOp(Math.sin, step, start) },
      cos: function(step,start) { return stepOp(Math.cos, step, start) },
      tan: function(step,start) { return stepOp(Math.tan, step, start) },
      sqrt: function(step,start) { return stepOp(Math.sqrt, step, start) },
      exp: function(step,start) { return stepOp(Math.exp, step, start)},
      pow: function(step,start,pow) { return stepOp(function(x) { return Math.pow(x,pow) }, step, start) },
      step: step,
      log: function(step,start) { return stepOp(Math.log, step, start) },
      normal: apNorm,
      normalInt: apNormInt,
      clampedNormal: clampedNorm,
      normalTail: normTail,
      setNormal: setNorm,
   },
   String: { 
      fromChars: fromChars,
      name: name,
      phrase: phrase,
      fromSet: strSet
   },
   Date: {
      forwardSeq: function(step, label, start) { return dateSeq(true, step, label, start) }, 
      reverseSeq: function(step, label, start) { return dateSeq(false, step, label, start) }  
   },
   Boolean: {
      weightedUniform: boolDensity
   },
   Value: {
      self: self,
      propagator: propagator
   },
   Selector: {
      byWeight: weightedSelector,
      byIndex: indexSelector,
      sparsify: sparsify
   }
};

/*
 * wvals: an array of items like [ { weight: 23.2, value: xxx }, ... ]
 */
function weightedSelector(wvals) {
   // sum the weights so we can normalize to [0.0,1)
   var totalWeight = _.reduce(wvals, function(memo, item) {
      return memo + item.weight;
   }, 0);
   var normalizer = 1.0/totalWeight;
   var pos = 0;
   var itemlist = _.map(wvals, function(item) {
      var last = pos;
      pos += item.weight*normalizer;
      return { lbound: last, ubound: pos, weight: item.weight, value: item.value };
   });
   
   return function() {
      var p = Math.random();
      var entry = _.find(itemlist, function(item) {
         return p >= item.lbound && p < item.ubound;
      });
      if(entry != null) {
         return entry.value;
      } else {
         return null;
      }
   }
}

/*
 * list: an array of values
 * idxFn: a function which returns an index into the list
 */
function indexSelector(list, idxFn) {
   if(!list || list.length==0) throw new Error("selector called with empty or missing list");
   var ifn = typeof idxFn == 'function' ? idxFn : setNorm(list.length);
   var len = list.length;
    return function() {
       var idx = ifn();
       if(idx < 0) return list[0];
       else if (idx >= len) return list[len-1];
       else return list[idx];
    }
}

function strSet(size, gfn) {
    var n = Number(size) && size > 0 ? size : 11;
    var s = (typeof gfn == 'function') ? gfn : name();
    var list = [];
    for(var i=0; i<n; ++i) {
        list.push(s());
    }
    return indexSelector(list);
}


function fromChars(chars, mean, stdev) {
    var m = Number(mean) && mean > 0 ? mean : 9;
    var cpicker = setNorm(chars.length);
    var sizer = apNormInt(m,stdev);
    return function() {
        var size = sizer();
        var str = "";
        for(var i=0; i<size;++i) {
            str += chars[cpicker()];
        }
        return str;
    }
}

function name(mean, stdev) {
    var m = Number(mean) ? mean : 9;
    var s = Number(stdev) ? stdev : 3;
    var chars = "fyghjkcdaiboamturslnpvwxzq";
    return fromChars(chars, m, s);
}

function phrase(mean, stdev) {
    var m = Number(mean) ? mean : 8;
    var s = Number(stdev) ? stdev : 3;
    var sizer = apNormInt(m,s);
    var words = name();
    return function() {
        var size = sizer();
        var str = "";
        if(size == 0) size = 2;
        for(var i=0; i<size;++i) {
            if(i>0) str += " ";
            str += words();
        }
        return str;
    }
}


/*
 * Make objects with variable shapes. fieldGenerator is a hash
 * (fieldName:valueGenFn) where the valueGenFn can produce a value for
 * the named field. fieldSetGenerator is a function which produces a
 * set of fieldNames for which field kv pairs should be generated in a
 * given object.
 *
 * makeObj and makeArr can be used along with Clone to recursively
 * generate objects, ie stuff the makeObj/makeArr function into a
 * field which needs an obj or arr, and bob's yer uncle!
 */
function makeObj(fieldSetGenerator, fieldGenerators) {
    return function() {
        var fields = fieldSetGenerator();
        var obj = {};
        _.each(fields, function(k) {
            if(typeof fieldGenerators[k] == 'function')
                obj[k] = fieldGenerators[k]();
        });
        return obj;
    }
}

function makeArr(sizeFn, itemFn) {
    return function() {
        var size = sizeFn();
        var arr = [];
        for(var i=0; i<size;++i) {
            arr.push(itemFn());
        } 
        return arr;
    }
}

function makeSet(sizeFn, itemFn) {
    return function() {
        var size = sizeFn();
        var arr = {};
        do {
            arr[itemFn()] = true;
        } while(_.keys(arr).length < size);
        return _.keys(arr);
    }
}

function step(step,start) { 
    return stepOp(function(x) { 
        return x;
    }, step, start) 
}

function stepOp(op, step, start) {
   var se = Number(step) ? Number(step) : 1;
   var pos = Number(start) ? Number(start) : 0;
    
    return function() {
       // multiplying position*step seems to be less prone to
       // aggregating floaty badness when step/start are non-integer
       // (vs doing pos = pos+se)
       return op((pos++)*se);
    }
}


/* Date.forward(5,'minute', new Date()) */
/* Date.reverse(1,'ms', 1328078561867) */
function dateSeq (fwd, step, label, start) {    
    var inc = fwd ? step : -step;
    var s;
    if(typeof start == 'number') {
        s = new Date(start);
    } else if(start instanceof Date) {
        s = start;
    } else {
        s = new Date();
    }

    return function() {
        return dateInc(inc, label, s);
    }
};

function dateInc(incval, label, date) {
    switch(label) {
    case 'ms':
    case 'millisecond':
        date.setMilliseconds(date.getMilliseconds() + incval);
        break;
    case 's':
    case 'second':
        date.setSeconds(date.getSeconds() + incval);
        break;
    case 'm':
    case 'minute':
        date.setMinutes(date.getMinutes() + incval);
        break;
    case 'h':
    case 'hour':
        date.setHours(date.getHours() + incval);
        break;
    case 'd':
    case 'day':
        date.setDate(date.getDate() + incval);
        break;
    case 'M':
    case 'month':
        date.setMonth(date.getMonth() + incval);
        break;
    case 'y':
    case 'year':
        date.setFullYear(get.getFullYear() + incval);
        break;
    }
    return date;
}

function boolDensity(d) {
    return function() {
        return Math.random() > d; 
    }
}

/*
 * Returns the value given to it.
 */
function self(n) {
    return function() {
        return n;
    }
}

/*
 * Returns a normal distribution approximator based on N uniform
 * values, where 3 and 12 are good choices for n.
 */
function apNorm(mean, stdev, n) {
    var t = Number(n) ? Math.ceil(n) : 3;
    var m = Number(mean) ? mean : 0;
    var d = Number(stdev) ? stdev : 1;
    var th = t/2;
    return function() {
        var x = 0;
        _.times(t, function() { x += Math.random(); });
        return m + d*(x - th);
    }
}

function apNormInt(mean, stdev, n) {
    var f = apNorm(mean, stdev, n);
    return function() {
        return Math.floor(f());
    }
}

/*
 * Returns a normal distribution approximator with the tails cut
 * off. Swap max/min vals to get one with only tails.
 */
function clampedNorm(mean, stdev, min, max, n) {
  var mi = Number(min) ? min : -1;
  var ma = Number(max) ? max : -mi;
  g = apNorm(mean, stdev, n);
  return function() {
    var x;
    if(mi < ma) {
      do { x = g(); } while(x < mi || x > ma);
    } else {
      do { x = g(); } while(x < mi && x > ma);
    }
    return x;
  }
}

function normTail(mean, stdev, lowpass, highpass, n) {
    var mi = Number(lowpass) ? lowpass : -1;
    var ma = Number(highpass) ? highpass : -highpass;
    g = apNorm(mean, stdev, n);
    return function() {
        var x;
        do { x = g(); } while(x > mi && x < ma);
        return x;
    }
}

/*
 * Returns an index into a set which selects the middle elements
 * normally often, and the outer edge elements almost never.
 */
function setNorm(size, stdev, mean, n) {
    var m = (Number(mean) && mean > 0 && mean < size) ? mean : size/2;
    var d = Number(stdev) ? stdev : size/6;
    var f = clampedNorm(size/2, size/3, 0, size, n);
    return function() {
        var x = Math.floor(f());
        return x;
    }
}

/*
 * Wrap a generator function in another function which allows a set of
 * functions to be triggered by a single function.
 */
function propagator(fn, len) {
   var s = Number(len) && len > 0 ? len : 1;
   var v;
   var h = [];
   return {
      next: function() {
         v = fn();
         if(h.push(v) > s) h.shift();
         return v;
      },
      current: function() {
         return v;
      },
      prev: function(i) {
         var len = h.length;
         var idx = Number(i) && i >=0 && i <len ? i : 0;
         if(len == 0) return null;
         return h[len - (1+idx)];
      },
      prevN: function(n) {
         var i = (n >= 0 && n < len) ? Number(n) : 0;
         return function() {
            var l = h.length;
            var idx = i < l ? l - (1+i) : l - 1;
            return h[idx];
         }
      }
   }
}


/*
 * Wrap a generator in one which returns undefined in proportion to density (0 = never null, 1 = always null)
 */
function sparsify(g, density) {
    return function() {
        if (Math.random() > density) 
            return g();
    }
}

exports.Factory = Factory;
exports.Clones = Clones;


