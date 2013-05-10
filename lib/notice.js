module.exports = (function(){
	var build = function(color, callback){
			return function(tit, cont){
				callback(color+'['+tit+']\x1B[0m '+cont);
			};
		};

	return {
		log: build("\x1B[32m", console.log),
		warn: build("\x1B[33m", console.warn),
		error: build("\x1B[1;31m", console.error)
	};
})();