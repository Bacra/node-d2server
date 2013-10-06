/**
 * 类继承
 * @param  {Function} constructor      新类
 * @param  {Function} superConstructor 继承类
 * @param  {JSON}     proto            重写方法
 * @return {Function}                  新类
 */
function inherits(constructor, superConstructor, proto){
	var temp = function(){};
	temp.prototype = superConstructor.prototype;
	var myPrototype = new temp();

	if (proto) {
		for(var i in proto) {
			if (proto.hasOwnProperty(i)) myPrototype[i] = proto[i];
		}
	}
	// _super指向父类
	// 为func和prototype都加上_super，方便调用的时候，灵活地进行切换
	myPrototype._super = superConstructor;
	constructor._super = superConstructor;

	return inherits.init(constructor, myPrototype);
}


/**
 * 快速创建新的类
 * @param  {Function} constructor      新类
 * @param  {JSON}     proto            原型链方法
 * @return {Function}                  新类
 */
inherits.init = function(constructor, proto){
	proto.constructor = constructor;
	constructor._const = constructor;

	// 提供直接创建类方法
	var temp = function(args){
		return constructor.apply(this, args);
	};
	constructor.prototype = temp.prototype = proto;

	constructor.create = function(){
		var obj = new temp(arguments);
		if (obj.init) obj.init();
		return obj;
	};
	constructor.create._const = constructor;

	return constructor;
};


module.exports = inherits;
