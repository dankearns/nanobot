var nanobot = require('./');
var _ = require('underscore');
var ow = require('./objwriter.js');

var numseq = nanobot.Factory.Number.step(1,0,1);
var timeseq = nanobot.Factory.Date.forwardSeq(3, "m", new Date().getTime());
var ynm = nanobot.Factory.Value.selector(['discarded','stale','fresh','out of stock']);

var names = nanobot.Factory.String.fromChars('bcdaeorst',6);
var fruit = nanobot.Factory.Value.selector(['strawberry','banana','mango','cherry','blueberry','kiwi','wheatgrass','soybeans']);
var arrsz = nanobot.Factory.Number.normalInt(4,3);
var amak = nanobot.Factory.Set.maker(arrsz, fruit);

var template = {
    id: numseq,
    created: timeseq,
    name: names,
    status: ynm,
    ingredients: amak,
};

var maker = nanobot.Clones(template);
var w = new ow.ObjWriter(50020, maker);
w.generate();

