var util    = require('util'),
	request = require('request'),
	JsonRPC = require('jr2-helper');
var Client  = require('./client.js'),
	JrUtil  = require('../utils'),
	mix     = JrUtil.mix;

function Http(url, opts){
	this._superInit();
	if(typeof url === 'number'){
		url = 'http://127.0.0.1:' + url; 
	}
	if(!/^https?:\/\//.test(url)){
		url = 'http://' + url;
	}
	this.opts = mix({
		url : url
	});
}
util.inherits(Http, Client);

Http.prototype.sendTo = function(data){
	var self = this;
	if(data.length > 512){
		var opt = mix({
			method : 'POST',
			json   : data
		}, this.opts);
	} else {
		var opt = mix({
			headers : {
				jsonrpc : data
			}
		}, this.opts);
		
	}
	(function(id){
		request(opt, function(error, response, body){
			if(!error){
				var retData = response.headers['x-jsonrpc'] || body;
				self.emit('data', retData);
			} else {
				self.emit('data', JsonRPC.resErrFmt(JsonRPC.ERRORS.INVALID_REQUEST, id, error));
			}
		});
	})(this.id);	
}

module.exports = Http;
