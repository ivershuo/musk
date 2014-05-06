var Server = {
	Sock   : require('./sock.js'),
	Http   : require('./http.js'),
	Ws     : require('./ws.js')
};

var _Server = {};
for(var k in Server){
	_Server[k.toLowerCase()] = Server[k];
}

Server.start = function(mod, argv){
	mod = mod.toLowerCase();
	function MJ(){};
	MJ.prototype = _Server[mod].prototype;
	var mj = new MJ();
	_Server[mod].apply(mj, argv);
	return mj;
}

module.exports = Server;