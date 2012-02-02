var vows = require('vows');
var assert = require('assert');
var nb = require('../src/nanobot');
var _ = require('underscore');

var obj1 = {hello: 'world', foo: { bar: 'bas' } };
var obj2 = {hello: function() { return "world" }, foo: { bar: 'bas', bat: function() { return "baz" }}};
var obj3 = { sin: 0.5514266812418447,
             cos: 0.8342233605064084,
             tan: 0.6610060414840285,
             sqrt: 17.88854381999832,
             exp: 9.423976816163585e+138,
             pow: 102400,
             step: 321,
             log: 0.9588472820557219 };

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
                step: nb.Factory.Number.step(1,0,1),
                log: nb.Factory.Number.sin(10,0)
            };
            var gen = nb.Clones(obj);
            var objlist = []
            for(var i=0; i<320;++i) {
                objlist.push(gen());
            }
            this.callback(null, objlist);
        },
        'should have a sin sequence' : function(list) {
            //console.log(list[319]);
            var test = list[list.length -1];
            assert.equal(320, list.length);
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
    }
});


v.export(module);
