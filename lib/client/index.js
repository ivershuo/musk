var Client = {
	Sock   : require('./sock.js'),
	Http   : require('./http.js'),
	Ws     : require('./ws.js')
};

var _Client = {};
for(var k in Client){
	_Client[k.toLowerCase()] = Client[k];
}

Client.create = function(mod, argv){
	mod = mod.toLowerCase();
	function MJ(){};
	MJ.prototype = _Client[mod].prototype;
	var mj = new MJ();
	_Client[mod].apply(mj, argv);
	return mj;
}

module.exports = Client;