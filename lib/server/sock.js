var util    = require('util'),
	fs      = require('fs'),
	net     = require('net');
var Server  = require('./server.js');

function Sock(srvObj, port){
	this._superInit(srvObj);

	this.createSock(Array.prototype.slice.call(arguments, 1));
}
util.inherits(Sock, Server);

Sock.prototype.createSock = function(listenData){
	var self = this;
	var server = net.createServer();
	server.listen.apply(server, listenData);

	server.on('connection', function(sock){
		var obj = self.obj;
		sock.setEncoding('utf8');
		sock.on('data', function(data){
			data.split('{SPLIT}').forEach(function(data){
				if(data){
					var retMethod = 'write';
					try{
						var _data = JSON.parse(data);
						if(_data.method === '__jr_close__'){
							retMethod = 'end';
						}
					} catch(e){}			
					obj.do(data).then(function(ret){
						sock && sock.writable && sock[retMethod](ret + '{SPLIT}');
					});
				}				
			});
		});

		obj.listen(function(data){
			sock && sock.writable && sock.write(data);
		});

		self.on('closeSignal', function(){
			sock && sock.writable && sock.end();
		});
	});

	this.server = server;
}
Sock.prototype.stop = function(){
	var server = this.server;
	this.emit('closeSignal');
	setTimeout(function(){
		if(typeof server.address() === 'string'){
			try{
				fs.unlink(server.address());
			} catch(e){}
		}
		process.exit();
	}, 20);
}
Sock.prototype.init = function(){
}

module.exports = Sock;