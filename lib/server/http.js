var util    = require('util'),
	url     = require('url'),
	cookie  = require('cookie'),
	http    = require('http'),
	querystring = require('querystring'),
	JsonRPC = require('jr2-helper');
var Server  = require('./server.js'),
	JrUtil  = require('../utils'),
	mix     = JrUtil.mix;

function Http(srvObj, port, host, backlog){
	this._superInit(srvObj);

	this.createHttp(Array.prototype.slice.call(arguments, 1));
}
util.inherits(Http, Server);

function getQueryData(data){
	var retData;
	if(data.jsonrpc){
		retData = data.jsonrpc;
	} else if(data.method) {
		var method = data.method,
			id     = parseInt(data.id, 10) || 1;
		var params = data['param[]'];
		if(!params && data.params){
			var paramStr = data.params;
			if(/^\{|\[/.test(params)){
				try{
					params = JSON.parse(paramStr);
				} catch(e){}
			} else {
				params = [paramStr];
			}
		}
		if(!params){
			params = data;
			delete params.method;
			delete params.id;
			delete params._cb;
		}
		retData = JsonRPC.reqFmt(method, params, id);
	}

	return retData;
}

mix(Http.prototype, {
	getJrData : function(req, body){
		var jrData,
			headers = req.headers,
			querys  = url.parse(req.url, true).query,
			cookies = cookie.parse(headers.cookie || '');

		var charset     = 'utf-8',
			contentType = headers['content-type'];
		if(contentType){
			var contentData  = contentType.split(';');
			contentType      = contentData[0].trim();
			var charsetMatch = contentData.slice(1).join('').match(/charset=((?:\w|-)+)/);
			charset          = charsetMatch && charsetMatch[1] || charset;
		}
		var data = Buffer.concat(body).toString(charset);
		var path = url.parse(req.url).pathname.replace(/\/$/, ''),
			pathData = path.split('/').slice(1),
			dataFromPath = {},
			paramsFromPath;
		if(pathData.length){
			dataFromPath = {
				method    : pathData[0],
				id        : parseInt(pathData[1], 10) || 1
			}
			paramsFromPath = pathData.slice(2);
			if(!querys['param[]'] && !querys.params){
				querys['param[]'] = paramsFromPath
			}
		}

		var reqMethod = req.method.toLowerCase();
		if(reqMethod === 'post'){
			if(contentType === 'application/json'){
				jrData = data;
			} else if(contentType === 'application/x-www-form-urlencoded'){
				var postData = mix(dataFromPath, querystring.parse(data));
				jrData = getQueryData(mix(postData, querys));
			}
		} else if(reqMethod === 'get'){
			req.__cbName = (querys._cb || '').replace(/[^\w\.]/g, '');
			jrData = getQueryData(mix(dataFromPath, querys));
		}
		if(!jrData && !pathData.length){
			if(headers.jsonrpc){
				jrData = headers.jsonrpc;
			} else if(cookies.jsonrpc){
				jrData = cookies.jsonrpc;
			}
		}

		return jrData;
	},
	send : function(res, ret){
		var statusCode  = 200,
			contentType = 'application/json',
			ret1        = ret;
		if(res.__cbName){
			contentType = 'application/javascript';
			ret         = res.__cbName + '(' + ret +');';
		}
		var headerData = {
			'Content-Type' : contentType + '; charset=UTF-8'
		}
		ret1.length < 1024 && (headerData['x-jsonrpc'] = ret1);

		res.writeHead(statusCode, headerData);
		res.end(ret);
	},
	createHttp : function(listenData){
		var self = this;
		var server = http.createServer();
		server.on('request', function(req, res){
			var obj = self.obj,
				buffer = [];

			req.on('data', function(trunk){
				buffer.push(trunk);
			}).on('end', function(){
				var jrData = self.getJrData(req, buffer);
				res.__cbName = req.__cbName;

				var t = setTimeout(function(){
					self.send(res, JsonRPC.resErrFmt(JsonRPC.ERROR_CODES.TIME_OUT));
				}, 10000);

				obj.do(jrData).then(function(ret){
					self.send(res, ret);
					cleatTimeout(t);
				});
			});
		});

		server.listen.apply(server, listenData);
		this.server = server;
	},
	stop : function(){
		this.server.close();
		process.exit();
	},
	init : function(){
	}
});

module.exports = Http;