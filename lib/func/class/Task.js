/**
 * 将多个异步任务指向同一结束回调函数
 * 
 * @param  {Function} endCall 队列结束时运行的函数
 */
module.exports = require('../../mod.js').load('inherits').init(function(endCall){
	this.endCall = endCall;
}, {
	'init': function(){
		this.list = [];
		this.waitNum = 0;
		// 创建可赋值的方法
		this.completeDR = this.complete.bind(this);
	},
	'complete': function(){
		// 和isDoing判断相同
		if (--this.waitNum > 0) return false;
		this.end();
		return true;
	},
	'add': function(callback){
		this.list.push(callback);
		// 正在运行过程中插入callback
		if (this.isDoing()) {
			this.waitNum++;
			callback(this.complete.bind(this));
		}
	},
	'start': function(){
		if (this.isDoing()) return false;

		this.waitNum = this.list.length;
		var complete = this.completeDR;
		this.list.forEach(function(func){
			func(complete);
		});
		var self = this;
		setInterval(function(){
			console.log(self.waitNum);
		}, 2000);
		return true;
	},
	'end': function(){
		this.endCall(this.waitNum);
	},
	'isDoing': function(){
		return this.waitNum > 0;
	},
	/**
	 * 重置队列
	 * @return {Boolean} 是否reset成功
	 */
	'reset': function(){
		if (this.isDoing()) return false;
		this.waitNum = 0;
		return true;
	}
});
