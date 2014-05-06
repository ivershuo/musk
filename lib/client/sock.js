var util    = require('util'),	
	net     = require('net'),
	JsonRPC = require('jr2-helper');
var Client  = require('./client.js'),
	JrUtil  = require('../utils'),
	mix     = JrUtil.mix;

function Sock(port, host){
	var argv = Array.prototype.slice.call(arguments, 0);
	this.init(argv);	
}
util.inherits(Sock, Client);

mix(Sock.prototype, {
	sendTo : function(data){
		var sock = this.sock;
		sock && sock.writable && sock.write(data + '{SPLIT}');
	},
	onSockData : function(){
		var self = this,
			sock = this.sock;
		sock.on('data', function(dataStr){
			dataStr.split('{SPLIT}').forEach(function(data){
				if(data){
					self.emit('data', data);
				}
			});
		});

		sock.on('end', function(data){
			self.sock = null;
			self.emit('end');
		});

		sock.on('close', function(data){
			self.sock = null;
			self.emit('close');
		});
	},
	init : function(argv){
		this._superInit();

		var sock = net.connect.apply(net, argv);
		sock.setEncoding('utf8');

		var self = this;
		sock.on('error', function(e){
			self.emit('err', e);
		});

		this.sock = sock;
		this.onSockData();
	}
});

module.exports = Sock;