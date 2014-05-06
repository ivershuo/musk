var util    = require('util'),
	events  = require('events'),
	when    = require('when'),
	JsonRPC = require('jr2-helper');
var JrUtil  = require('../utils'),
	mix     = JrUtil.mix;

function Client(){
}
util.inherits(Client, events.EventEmitter);

mix(Client.prototype, {
	send : function(name, params, cb){
		var defer = when.defer(),
			id     = this.id++;
		this['_defer' + id] = defer;
		this['_cb' + id] = cb;

		var	data   = JsonRPC.reqFmt(name, params, id);
		this.sendTo(data);

		return defer.promise;
	},
	response : function(data, id){
		var	data   = JsonRPC.resFmt(data, id);
		this.sendTo(data);
	},
	dataReceiver : function(){
		var self = this;
		this.on('data', function(dataStr){
			var data = JsonRPC.parse(dataStr);
			if(data.method){
				self.emit('request', data);
			} else if(data.id){
				var cbName    = '_cb' + data.id,
					deferName = '_defer' + data.id,
					cb        = self[cbName],
					defer     = self[deferName];
				cb && cb(data.result);
				defer && defer[data.error ? 'reject' : 'resolve'](data.error || data.result);
				self[cbName] = null;
				self[defer] = null;

				if(data.error){
					self.emit('err', mix({id: data.id}, data.error));
				} else {
					self.emit('ok', mix({id: data.id}, data.result));
				}
			} else if(data.error){
				self.emit('err', data.error);
			}
		});
	},
	getRpcMethod : function(){
		var defer = when.defer();
		if(this.obj){
			defer.resolve(obj);
		} else if(this.isPdReady){
			this.readyList.push(defer);
		} else {
			this.isPdReady = true;
		var obj = {},
			self = this;
			this.send('__jr_getRpcMethod__').then(function(methods){
				methods.forEach(function(method){
					obj[method] = function(){
						var params = Array.prototype.slice.call(arguments, 0),
							cbFunc = params.pop();
						if(typeof cbFunc !== 'function'){
							params.push(cbFunc);
							cbFunc = null;
						}
						return self.send(method, params, cbFunc);
					}
				});

				self.obj = obj;
				defer.resolve(obj);

				self.readyList.forEach(function(defer){
					defer.resolve(self.obj);
				});
				this.isPdReady = false;
			});
		}		
		return defer.promise;
	},
	ready : function(cb){
		return this.getRpcMethod().then(function(obj){
			cb && cb(obj);
			return obj;
		});
	},
	close : function(cb){
		return this.send('__jr_close__', [], cb);
	},
	_superInit : function(){
		this.id = 1;
		this.dataReceiver();

		this.isPdReady = false;
		this.readyList = [];
	}
});

module.exports = Client;