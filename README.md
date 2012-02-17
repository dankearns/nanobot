nanobot
=======

Nanobot is a massively overengineered approach to generating sample, test or demo data.

Quick Start:
--------------

    // start a simple counter at 0, increment by adding one every step
    var numseq = nanobot.Factory.Number.step(1,0,1);

    // start a date sequence which skips three days between each value
    var timeseq = nanobot.Factory.Date.forwardSeq(3, "day", new Date().getTime());

    // create a set of 10 random strings, from which we will draw one member at a time
    var vals = nanobot.Factory.String.fromSet(10);

    // create a selector which will return a value from a set we supply manually
    var ynm = nanobot.Factory.Selector.byIndex(['yes','no','maybe']);

    // stuff our generator functions into our template object 
    var template = {
        _id: numseq,
        status: ynm,
        name: { 
            first: vals, 
            last: vals 
        },
        created: function() { return "" + timeseq() }
    };

    // create a function which will execute our template
    var maker = nanobot.Clones(template);

    // make an army of clones to do our nefarious bidding
    for(var i=0; i<100; ++i) {
      var obj = maker();
      console.log(obj);
    }

Output
------

    ...
    { _id: 81,
      status: 'no',
      name: { first: 'ltlturrri', last: 'wrdaeliot' },
      created: 'Fri Sep 28 2012 18:33:32 GMT-0700 (PDT)' }
    { _id: 82,
      status: 'maybe',
      name: { first: 'wrdaeliot', last: 'wrdaeliot' },
      created: 'Mon Oct 01 2012 18:33:32 GMT-0700 (PDT)' }
    ...


Get Fancy
----------

The template expansion can be applied inside of generator functions as
well, because all overengineered systems need recursion! Here we make
the ingredients array a variable size for our simulated smoothies. We
could also create objects with variable field populations to
simulate sparse attributes.

    var fruitnames = ['strawberry','banana','mango','cherry','blueberry','kiwi','wheatgrass','soybeans'];
    var fruit = nanobot.Factory.Selector.byIndex(fruitnames);
    var names = nanobot.Factory.String.fromChars('bcdaeorst',6);
    var arrsz = nanobot.Factory.Number.normalInt(4,3);
    var amak = nanobot.Factory.Set.maker(arrsz, fruit);

    var template = {
        name: names,
        ingredients: amak
    };

    var maker = nanobot.Clones(template);
    maker();

Output
-------

    { name: 'ooeee',
      ingredients: [ 'cherry', 'blueberry', 'wheatgrass', 'mango' ] }
    { name: 'deaora', 
      ingredients: [ 'wheatgrass' ] }
    { name: 'edcrd',
      ingredients: [ 'kiwi', 'cherry', 'blueberry' ] }
    { name: 'caear',
      ingredients: [ 'kiwi', 'cherry', 'blueberry', 'mango', 'soybeans' ] }

ObjWriter
----------

ObjWriter is a convenience mechanism for creating a set of files, one
per generated object. It will spread the generated files across a set
of directories to avoid the dreaded 20-minute 'ls':

    var maker = nanobot.Clones(template);
    var w = new nanobot.ObjWriter(50000, maker);
    w.generate();

Output
---------

    Done writing, output is in /tmp/objwriter.
    Ok: 50020, Errored: 0 time: 35600ms

    [nanobot] dan :-)ls /tmp/objwriter/
    gen_0/ gen_1/ gen_2/ gen_3/ gen_4/ gen_5/
    [nanobot] dan :-)ls /tmp/objwriter/gen_1/|head -n 10
    obj_1.json
    obj_10003.json
    obj_10009.json
    ...

Correlated Values
--------------------

Say you need some values which are derived in some way from other values, nanobot.Value.Propagator is your friend!

    var timeseq = nanobot.Factory.Date.forwardSeq(3, "day", new Date().getTime());
    var wrapper = nanobot.Factory.Value.propagator(timeseq);
    var startDate = wrapper.current;
    var oneWeekLater = function() { 
       var d = wrapper.current();
       return d.setDate(d.getDate() + 7);
    };

    var template = { start: startDate, end: oneWeekLater };
    var maker = nanobot.Clones(template);

    // make an army of clones to do our nefarious bidding
    for(var i=0; i<100; ++i) {
      var obj = maker();
      wrapper.next();
      console.log(obj);
    }

    
More Correlated Values
------------------------

    // create a set of 10 random strings, from which we will draw one member at a time
    var vals = nanobot.Factory.String.fromSet(10);
    // remember the last 10 values we've generated
    var wrapper = nanobot.Factory.Value.propagator(vals, 10);
    
    var template = { current: wrapper.next, previous: wrapper.prevN(1), wayOld: wrapper.prevN(7) };
    ...

Useful Datasets
-----------------

nanobot.Factory.Lists includes a few functions which can generate
useful lists of real-world values for things like people and
products. The list values and/or weights are derived from public
sources as indicated. Sample:

    // straight-up census-weighted data:
    var p =require('nanobot').Lists.person();
    for(var i=0;i<100;++i) console.log(p);
    ....
    Thomas Rosen
    Doris Bates
    Joe Merritt
    Sharon Jones
    Andre Martin

    // more fun: combine only surnames!
    var p =require('nanobot').Lists.person(true);
    for(var i=0;i<100;++i) console.log(p);
    ....
    Salerno Tremblay
    Silva Shumaker
    Stallings Hughes
    Hannah Muscatello
    Moore Givens
    Hambrick Rocamora
    Salgado Vitale
    Glasgow Boone
    Nichols Ackermann
    Croom Gonsalves

    // and some products:
    var p =require('nanobot').Lists.person(true);
    for(var i=0;i<100;++i) console.log(p);
    ....
    Bioguard Master Calcium Hypochlorite
    Aqua Kill Insecticide
    Care Free Booost
    Rid-a-rat Rat & Mouse Killer

You can use your own datasets by passing { value: '', weight: ''} pairs to nanobot.Selector.byWeight
