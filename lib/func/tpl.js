/**
 * 处理简单的变量模版
 * @param  {Array}    dataName 变量名集合
 * @param  {String}   cont     <可选>模版原始内容（默认）
 * @return {Function}          模版渲染函数
 */
module.exports = function(dataName, cont){
	var reg = {};
	dataName.forEach(function(name){
		reg[name] = new RegExp('__'+name+'__', 'g');
	});

	/**
	 * 处理模版内容的render函数
	 * @param  {JSON}   data    变量数据
	 * @param  {String} newCont <可选>模版原始内容
	 * @return {String}         渲染之后的内容
	 */
	return function(data, newCont){
		if (!newCont) newCont = cont;
		for(var i in data){
			newCont = newCont.replace(reg[i], i in data ? data[i] : i);
		}
		return newCont;
	};
};

