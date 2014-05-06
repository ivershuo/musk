var util    = require('util'),	
	WS      = require('ws'),
	JsonRPC = require('jr2-helper');
var Client  = require('./client.js'),
	JrUtil  = require('../utils'),
	mix     = JrUtil.mix;

function Ws(host){
	this.init(host);
	this.pdSend = [];
}
util.inherits(Ws, Client);

mix(Ws.prototype, {
	sendTo : function(data){
		this.pdSend.push(data);
	},
	onWsData : function(){
		var self = this;

		this.ws.on('message', function(message) {
			self.emit('data', message);
		});
	},
	init : function(host){
		var self = this;
		this._superInit();

		if(typeof host === 'number'){
			host = 'ws://127.0.0.1:' + host; 
		}
		if(!/^wss?:\/\//.test(host)){
			host = 'ws://' + host;
		}
		var ws = new WS(host);
		ws.on('open', function(){
			self.sendTo = function(data){
				ws.readyState === ws.OPEN && ws.send(data);
			};

			self.pdSend.forEach(function(msg){
				self.sendTo(msg);
			});
		});

		ws.on('close', function(){
			self.emit('close');
			this.ws = null;
		});

		this.ws = ws;
		this.onWsData();
	}
});

module.exports = Ws;