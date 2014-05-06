var Utils = {
	JrWrap   : require('./jrwrap.js')
};
Utils.mix = function(des, src, map){
	map = map || function(d, s, i){
		if(!(des[i] || (i in des))){
			return s;
		}
		return d;
	}
	if(map === true){
		map = function(d,s){
			return s;
		}
	}
	for (i in src) {
		des[i] = map(des[i], src[i], i, des, src);
		if(des[i] === undefined) delete des[i];
	}
	return des;
}

module.exports = Utils;