var nanobot = require('./nanobot');
var _ = require('underscore');
var fs = require('fs');
var _path = require('path');
var async = require('async');

// file-per-dir
const DIRMAX = 10000;
const DIRPREFIX = "gen_";
const CONWRITES = 5;
const LOGINC = 5000;

var ObjWriter = function(count, generator, path, prefix, suffix) {
    this.prefix = prefix ? prefix : 'obj_';
    this.suffix = suffix ? suffix : '.json';
    this.path = path ? path : '/tmp/objwriter';
    this.count = count;
    this.generator = generator;
    this.dircount = Math.ceil(this.count/DIRMAX);
    this.dirnames = [];
    this.log = true;
}

ObjWriter.prototype.generate = function() {
    var self = this;
    var cb = function() { self.mkobjs(); };
    var path = this.path;

    _path.exists(path, function(x) {
        if(x) {
            fs.stat(path, function(err,stat) {
                if(err) {
                    throw err;
                } else {
                    if(stat.isDirectory())
                        self.mkdirs(cb);
                    else 
                        throw new Error(path + " is not a directory");
                }
            });
        } else {
            fs.mkdir(path, function(err) {
                if(err) throw err;
                self.mkdirs(cb);
            });
        }
    });
}

ObjWriter.prototype.mkdirs = function(cb) {
    var self = this;
    var count = this.dircount;
    var counter = 0;
    var errs = [];
    var complete = function(err) {
        ++counter;
        if(err) {
            if(err.code != 'EEXIST')
                errs.push(err);
        }
        if(counter == count) {
            if(errs.length > 0) 
                throw new Error(errs);
            else cb();
        }
    }

    for(var i=0; i< count;++i) {
        var dirname = DIRPREFIX + i;
        var dirpath = this.path + "/" + dirname;
        self.dirnames.push(dirpath);
        fs.mkdir(dirpath, 0777, function(err) {
            complete(err);
        });
    }

}


ObjWriter.prototype.mkobjs = function() {
    var count = this.count;
    var path = this.path;
    var dirnames = this.dirnames;
    var len = this.dirnames.length;
    var generator = this.generator;
    var errs = [];
    var start = new Date();
    var log = this.log;

    var status = 0;
    var q = async.queue(function(name, cb) {
        ++status;
        if(log && status > 5000 && status % LOGINC == 0)
            console.log(status + "/" + count);

        var obj = generator();
        fs.writeFile(name, JSON.stringify(obj) + "\n", cb);
    }, CONWRITES);

    q.drain = function() {
        var elapsed = (new Date()).getTime() - start.getTime();
        var ok = count - errs.length;
        console.log("Done writing, output is in " + path + ".");
        console.log("Ok: " + ok + ", Errored: " + errs.length + " time: " + elapsed + 'ms');
        if(errs.length > 0)
            console.log(errs);
    }

    var pre = this.prefix;
    var suf = this.suffix;
    for(var i=0;i<count;++i) {
        var dir = dirnames[i % len];
        var fn = dir + "/" + pre + i + suf;
        var id = i;
        q.push(fn, function(err) { 
            if(err) errs.push(err); 
        });
    }
}
exports.ObjWriter = ObjWriter;


