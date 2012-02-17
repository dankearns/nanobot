var nb = require('./nanobot');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var datadir = path.join(__dirname, '../data');

/*
 * mini class to load some data from a file and produce a weighted selector.
 * file should look like { "rows" : [ { "weight": xxx, "value": yyy }, ... ] }
 */
var WeightedList = function(path) {
   this.init = false;
   this.path = path;
};

WeightedList.prototype.generator = function() {
   if(!this.init) this.load();
   return this.gen;
};

WeightedList.prototype.load = function() {
   console.log('load: ' + this.path);
   var data = JSON.parse(fs.readFileSync(this.path,"utf-8"));
   var list = [];
   this.gen = nb.Factory.Selector.byWeight(_.map(data.rows, function(row) { 
      if(row.weight == 0) {
         return { value: row.value, weight: 0.0001 };
      } else {
         return row;
      }
   }));
};

/*
  * YMMV, but I think combining just last names generates much more interesting values!
 */
var person = function(lasts) {
   var last = new WeightedList(path.join(datadir, 'last_names.json')).generator();
   var first = new WeightedList(path.join(datadir, 'first_names.json')).generator();
   return function() {
      if(lasts)
         return last() + " " + last();
      else
         return first() + " " + last();
   }
};

var product = function() {
   var pests = JSON.parse(fs.readFileSync(path.join(datadir, 'pestproducts.json'), 'utf-8'));
   var house = JSON.parse(fs.readFileSync(path.join(datadir, 'houseproducts.json'), 'utf-8'));
   var list = pests.products.concat(house.products);
   var len = list.length;
   var idxFn = function() {
      return Math.floor(Math.random() * len);
   };
   return nb.Factory.Selector.byIndex(list, idxFn);
}

exports.person = person;
exports.product = product;
