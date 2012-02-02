nanobot
=======

Nanobot is a massively overengineered approach to generating sample, test or demo data.

Quick example:
--------------

    var numseq = nanobot.Factory.Number.step(1,0,1);
    var timeseq = nanobot.Factory.Date.forwardSeq(3, "day", new Date().getTime());
    var vals = nanobot.Factory.String.fromSet(10);
    var ynm = nanobot.Factory.Value.selector(['yes','no','maybe']);


    var template = {
        _id: numseq,
        status: ynm,
        name: { 
            first: vals, 
            last: vals 
        },
        created: function() { return "" + timeseq() }
    };

    var maker = nanobot.Clones(template);

    for(var i=0; i<100; ++i) {
      var obj = maker();
      console.log(obj);
    }


Enjoy!
-------
