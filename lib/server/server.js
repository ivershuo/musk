var util    = require('util'),
	events  = require('events'),
	path    = require('path');
var jrUtils = require('../utils'),
	JrWrap  = jrUtils.JrWrap;

function Server(){
}
util.inherits(Server, events.EventEmitter);

Server.prototype.bindObj = function(srvObj){
	var obj;
	if(typeof srvObj !== 'object'){
		if(srvObj.substr(0, 1) === '.'){
			srvObj = path.join(process.cwd(), srvObj);
		}
		obj = require(srvObj);
	} else {
		obj = srvObj;
	}
	
	var methods = [];
	for(var method in obj){
		if(typeof obj[method] === 'function'){
			methods.push(method);
		}
	}
	this.obj = new JrWrap(obj);
	this.methods = methods;
}
Server.prototype._superInit = function(srvObj){
	this.obj = null;
	this.methods = [];
	this.server = null;

	this.bindObj(srvObj);
}
Server.prototype.stop = function(){
	process.exit();
}

module.exports = Server;