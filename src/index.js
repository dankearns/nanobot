var nb = require('./nanobot');
var ow = require('./objwriter');
var da = require('./datasets');


exports.Factory = nb.Factory;
exports.Clones = nb.Clones;
exports.ObjWriter = ow.ObjWriter;
exports.Lists = {
   person: da.person,
   product: da.product
};

