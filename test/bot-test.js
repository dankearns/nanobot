var vows = require('vows');
var assert = require('assert');
var nb = require('../src/nanobot');
var _ = require('underscore');

var obj1 = {hello: 'world', foo: { bar: 'bas' } };
var obj2 = {hello: function() { return "world" }, foo: { bar: 'bas', bat: function() { return "baz" }}};
var obj3 = { sin: -0.015925862600098248,
             cos: 0.9998731754079828,
             tan: -0.01592788264731669,
             sqrt: 17.72004514666935,
             exp: 2.3359703045918785e+136,
             pow: 98596,
             step: 315,
             log: 5.749392985908253 };

var v = vows.describe('nanobot tests').addBatch({
   'a static template object' : {
      'topic': nb.Clones(obj1)(),
      'produces an accurate clone': function(obj) {
         assert.equal(JSON.stringify(obj1), JSON.stringify(obj));
      }
   },
   'a template with embedded functions' : {
      'topic': nb.Clones(obj2)(),
      'produces an object with generated data': function(obj) {
         assert.equal('{"hello":"world","foo":{"bar":"bas","bat":"baz"}}', JSON.stringify(obj));
      }
   },
   'a template with a bunch of number generators' : {
      'topic': function() {
         var obj = {
            sin: nb.Factory.Number.sin(0.1,0),
            cos: nb.Factory.Number.cos(0.1,0),
            tan: nb.Factory.Number.tan(0.1,0),
            sqrt: nb.Factory.Number.sqrt(1,0),
            exp: nb.Factory.Number.exp(1,0),
            pow: nb.Factory.Number.pow(1,0,2),
            step: nb.Factory.Number.step(1,1,1),
            log: nb.Factory.Number.log(1,0)
         };
         var gen = nb.Clones(obj);
         var objlist = []
         for(var i=0; i<315;++i) {
            objlist.push(gen());
         }
         this.callback(null, objlist);
      },
      'should have a sin sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(list.length, 315);
         assert.equal(test.sin, obj3.sin);
      },
      'should have a cos sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.cos, obj3.cos);
      },
      'should have a tan sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.tan, obj3.tan);
      },
      'should have a sqrt sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.sqrt, obj3.sqrt);
      },
      'should have a exp sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.exp, obj3.exp);
      },
      'should have a pow sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.pow, obj3.pow);
      },
      'should have a step sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.step, obj3.step);
      },
      'should have a log sequence' : function(list) {
         var test = list[list.length -1];
         assert.equal(test.log, obj3.log);
      }
   },
   'the normal generator': {
      topic: function() {
         var fn = nb.Factory.Number.normal();
         var list = [];
         for(var i=0; i<100; ++i) {
            list.push(fn());
         }
         this.callback(null, list);
      },
      'should return some positive numbers': function(list) {
         assert.isTrue(_.any(list, function(i) { return i > 0; }));
      },
      'should return some negative numbers': function(list) {
         assert.isTrue(_.any(list, function(i) { return i < 0; }));
      }
   },
   'the clamped normal generator': {
      topic: function() { 
         var fn = nb.Factory.Number.clampedNormal(10, 8, 8, 12);
         var list = [];
         for(var i=0;i<100;++i) {
            list.push(fn());
         }
         this.callback(null,list);
      },
      'should return only numbers within the specified range': function(list) {
         assert.equal(false, _.any(list, function(i) { return i <= 8 }));
         assert.equal(false, _.any(list, function(i) { return i >= 12 }));
      }
   },
   'the inverted clamped normal generator': {
      topic: function() { 
         var fn = nb.Factory.Number.normalTail(10, 10, 8, 12);
         var list = [];
         for(var i=0;i<100;++i) {
            list.push(fn());
         }
         this.callback(null,list);
      },
      'should return only numbers outside the specified range': function(list) {
         assert.isTrue(_.any(list, function(i) { return i < 8 }));
         assert.isTrue(_.any(list, function(i) { return i > 12 }));
         assert.isFalse(_.any(list, function(i) { return i >= 8 && i <= 12 }));
      }
   },
   'the set normal generator': {
      topic: function() {
         var fn = nb.Factory.Number.setNormal(10);
         var list = [];
         for(var i=0;i<100;++i) {
            list.push(fn());
         }
         this.callback(null, list);
      },
      'should return integers smaller than the set size': function(list) {
         assert.isFalse(_.any(list, function(i) { return i<0 || i>=10 }));
         assert.isFalse(_.any(list, function(i) { return Math.floor(i) != i; }));
      }
   },
   'the name generator': {
      topic: function() {
         var fn = nb.Factory.String.name();
         var list = [];
         for(var i=0;i<100;++i) {
            list.push(fn());
         }
         this.callback(null, list);
      },
      'should return some names': function(list) {
         assert.isString(list[3]);
         assert.isTrue(list[3].length > 0);
      }
   },
   'the character generator': {
      topic: function() {
         var fn = nb.Factory.String.fromChars('xo',8,2);
         var list = [];
         for(var i=0;i<50;++i) {
            list.push(fn());
         }
         this.callback(null, list);
      },
      'should return words made from supplied chars only': function(list) {
         assert.isTrue(_.all(list, function(s) { return /^[xo]+$/.test(s) }));
      }
   },
   'the phrase generator': {
      topic: function() {
         var fn = nb.Factory.String.phrase();
         var list = [];
         for(var i=0;i<50;++i) {
            list.push(fn());
         }
         this.callback(null, list);
      },
      'should return phrases': function(list) {
         assert.isTrue(_.all(list, function(s) { return /\w+ \w+/.test(s) }));
      }
   },
   'the dateseq generator': {
      topic: function() {
         var fn1 = nb.Factory.Date.forwardSeq(1,'s',0);
         var fn2 = nb.Factory.Date.reverseSeq(1,'s',10000);
         fn1();
         fn2();

         this.callback(null, {fn1: fn1(), fn2: fn2()});
      },
      'should generate a seconds-sequence': function(obj) {
         assert.equal(2000, obj.fn1.getTime());
         assert.equal(8000, obj.fn2.getTime());
      }
   },
   'the item-selector generator': {
      topic: function() {
         var list = {'banana':1,'chocolate':1,'strawberry':1,'coffee':1,'vanilla':1,'mint':1,'bubblegum':1};
         var fn = nb.Factory.Value.selector(_.keys(list));
         var l = [];
         for(var i=0; i<100; ++i) {
            l.push(fn());
         }
         this.callback(null, {set: list, list: l} );
      },
      'should return items from the list': function(obj) {
         assert.isTrue(_.all(obj.list, function(i) { return obj.set[i] }));
      }
   },
   'the stringset generator': {
      topic: function() {
         var ssg = nb.Factory.String.fromSet();
         var list = [];
         for (var i=0; i< 100; ++i) {
            list.push(ssg());
         }
         this.callback(null, list);
      },
      'should return duplicate items': function(list) {
         var seen = {};
         assert.isTrue(_.any(list, function(i) {
            if(seen[i]) return true;
            seen[i] = true;
         }));
      }
   },
   'a weighted selector': {
      topic: function() {
         var list = [
            { weight: 1, value: 'A' },
            { weight: 5, value: 'B' },
            { weight: 10, value: 'C' },
            { weight: 20, value: 'D' }
         ];
         var wsel = nb.Factory.Selector.byWeight(list);
         var counts = {'A':0,'B':0,'C':0,'D':0 };
         for(var i=0; i<10000; ++i) {
            counts[wsel()] += 1;
         }
         this.callback(null,counts);
      },
      'should return values according to their weights' : function(counts) {
         assert.isTrue(counts['A'] < counts['B']);
         assert.isTrue(counts['B'] < counts['C']);
         assert.isTrue(counts['C'] < counts['D']);
         assert.isTrue(5*counts['A'] < counts['D']);
      }
   },
   'an index selector' : {
      topic: function() {
         var list = [ 'A', 'B', 'C' ];
         var c = 0;
         var idxFn = function() { return c++; };
         var sel = nb.Factory.Selector.byIndex(list, idxFn);
         this.callback(null, sel);
      },
      'should return items by their indexes': function(sel) {
         assert.equal('A', sel());
         assert.equal('B', sel());
         assert.equal('C', sel());
      }
   },
   'a propagated generator' : {
      topic: function() {
         var g = nb.Factory.Number.step();
         var pg = nb.Factory.Value.propagator(g);
         this.callback(null,pg);
      },
      'should propagate the current value': function(pg) {
         assert.equal(pg.next(), 0);
         assert.equal(pg.next(), 1);
         assert.equal(pg.current(), 1);
         assert.equal(pg.prev(), 1);
      }
   },
   'a propagated generator with history' : {
      topic: function() {
         var g = nb.Factory.Number.step();
         var pg = nb.Factory.Value.propagator(g,10);
         for(var i=0; i<10; ++i) 
            pg.next();
         this.callback(null,pg);
      },
      'should propagate the current value': function(pg) {
         assert.equal(pg.current(), 9);
         assert.equal(pg.prev(), 9);
         assert.equal(pg.prev(1), 8);
         assert.equal(pg.prev(4), 5);
      },
      'should be able to generate memoized history functions': function(pg) {
         assert.equal(pg.prevN(0)(), 9); 
         assert.equal(pg.prevN(4)(), 5); 
         assert.equal(pg.prevN(3)(), 6); 
         assert.equal(pg.prevN(7)(), 2); 
         assert.equal(pg.prevN(9)(), 0); 
      }
   },
});


v.export(module);
