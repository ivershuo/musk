var util     = require('util'),
	WsServer = require('ws').Server;
var Server   = require('./server.js'),
	JrUtil   = require('../utils'),
	mix      = JrUtil.mix;

function Ws(srvObj, port){
	this._superInit(srvObj);

	this.createWs(port);
}
util.inherits(Ws, Server);

mix(Ws.prototype, {
	createWs : function(port){
		var self = this,
			opts;
		if(typeof port === 'object'){
			opts = port;
		} else {
			opts = {port : port}
		}
		var server = new WsServer(opts);

		server.on('connection', function(ws) {
			var obj = self.obj;
		    ws.on('message', function(data) {
		    	try{
		    		var _data = JSON.parse(data);
		    		if(_data.method === '__jr_close__'){
		    			ws.close();
		    		}
		    	} catch(e){}
		    	obj.do(data).then(function(ret){
					ws && ws.readyState === ws.OPEN && ws.send(ret);
				});
		    });

		    obj.listen(function(data){
				ws && ws.readyState === ws.OPEN && ws.send(data);
			});

			ws.on('close', function() {
			    ws = null;
			});
		});

		this.server = server;
	},
	stop : function(){
		this.server.close();
		process.exit();
	},
	init : function(){
	}
});

module.exports = Ws;