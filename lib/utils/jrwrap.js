var JsonRPC = require('jr2-helper');

var when = require('when');
var util = require('util');
	isArray	 = util.isArray;

function JrWrap(serverObj){
	this.serverObj = serverObj;
	this.cb = null;
	this.init();
}
JrWrap.prototype.init = function(){
	var serverObj = this.serverObj,
		self = this;
	serverObj.__jr_getRpcMethod__ = function(){
		return Object.keys(serverObj).filter(function(key){
			if(key !== '__jr_getRpcMethod__' && key !== 'out' && typeof serverObj[key] === 'function'){
				return true;
			}
		});
	}
	serverObj.on && serverObj.on('jrdata', function(data){
		self.cb && self.cb(JsonRPC.reqFmt(data.method, data.data, data.id));
	});

	if(!serverObj.out){
		this.serverObj.out = function(method, data, id){
			self.cb && self.cb(JsonRPC.reqFmt(method, data, id));
		}
	}	
}
JrWrap.prototype.do = function(data){
	var defer = when.defer();
	if(!data){
		defer.resolve(JsonRPC.resErrFmt(JsonRPC.ERRORS.INTERNAL_ERROR));
		return defer.promise;
	}
	if(typeof data === 'string'){
		data = JsonRPC.parse(data, true);
		if(typeof data === 'number'){
			defer.resolve(JsonRPC.resErrFmt(data));
			return defer.promise;
		}
	}

	datas = !isArray(data) ? [data] : data;
	var ids = [];
	var resolves = [],
		rets = [];
	for(var i = 0, l = datas.length; i < l; i++){
		if(!datas[i]){
			continue;
		}
		var data       = datas[i],
			id         = data.id,
			methodName = data.method,
			method     = this.serverObj[methodName];
		ids.push(id);
		if(methodName && typeof method === 'function'){
			try{
				id && (rets[i] = when(method[isArray(data.params) ? 'apply' : 'call'](method, data.params || [])));			
			} catch(e){
				id && (resolves[i] = JsonRPC.resErrFmt(e, id));
			}
		} else {
			id && (resolves[i] = JsonRPC.resErrFmt(JsonRPC.ERRORS.METHOD_NOT_FOUND, id, {
				method : methodName || null
			}));
		}
	}

	when.settle(rets).then(function(pmsObjs){
		for(var i = 0, l = pmsObjs.length; i < l; i++){
			var pms = pmsObjs[i],
				id  = ids[i];
			if(pms.state === 'fulfilled'){
				id && (resolves[i] = JsonRPC.resFmt(pms.value, id));
			} else if(pms.state === 'rejected'){
				id && (resolves[i] = JsonRPC.resErrFmt(JsonRPC.ERRORS.INTERNAL_ERROR, id, retErr));
			}
		}
		var data = resolves.length > 1 ?  '[' + resolves.join(',') + ']' : resolves[0];		
		defer.resolve(data || JsonRPC.resErrFmt(JsonRPC.ERRORS.INTERNAL_ERROR));
	});
	return defer.promise;
}
JrWrap.prototype.listen = function(cb){
	cb && (this.cb = cb);
}

module.exports = JrWrap;