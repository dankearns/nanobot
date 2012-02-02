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
    var ynm = nanobot.Factory.Value.selector(['yes','no','maybe']);

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
the ingredients array a variable size for our simulate smoothies. We
could also create objects with variable field populations to
simulate sparse attributes.

    var names = nanobot.Factory.String.fromChars('bcdaeorst',6);
    var fruit = nanobot.Factory.Value.selector(['strawberry','banana','mango','cherry','blueberry','kiwi','wheatgrass','soybeans']);
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


