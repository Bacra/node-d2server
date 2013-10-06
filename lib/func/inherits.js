/**
 * 快速创建新的类
 * @param  {Function} constructor      新类
 * @param  {JSON}     proto            原型链方法
 * @return {Function}                  新类的create方法
 */
function initClass(constructor, proto){
	proto.constructor = constructor;
	constructor._const = constructor;

	// 提供直接创建类方法
	var temp = function(args){
			return constructor.apply(this, args);
		},
		create = function(){
			var obj = new temp(arguments);
			if (obj.init) obj.init();
			return obj;
		};
	constructor.prototype = temp.prototype = proto;
	constructor.create = create;
	create._const = constructor;

	return create;
}


/**
 * 类继承
 * @param  {Function} constructor      新类
 * @param  {Function} superConstructor 继承类
 * @param  {JSON}     proto            重写方法
 * @return @see initClass
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

	return initClass(constructor, myPrototype);
}

inherits.init = initClass;
module.exports = inherits;
