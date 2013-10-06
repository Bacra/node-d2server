/**
 * 创建队列来管理任务
 *
 * @param  {Function} endCall 队列结束时运行的函数
 */
module.exports = require('../../mod.js').load('inherits').init(function(endCall){
	this.endCall = this.endCall;
	this.list = [];
}, {
	'init': function(){
		this.nextDR = this.next.bind(this);
		this.endDR = this.end.bind(this);
		this.index = -1;
	},
	'add': function(endCall){
		this.list.push(endCall);
	},
	'start': function(){
		if (this.isDoing()) return false;
		this.next();
		return true;
	},
	'end': function(waitNum){
		if (this.endCall) this.endCall(isNaN(waitNum) ? this.list.length - this.index -1 : waitNum);
	},
	'next': function(){
		if (++this.index < this.list.length) {
			this.list[this.index](this.nextDR, this.endDR);
		} else {
			this.end(0);
		}
	},
	'isDoing': function(){
		return this.index != -1;
	},
	'reset': function(){
		if (!this.isDoing()) return false;
		this.index = -1;
		return true;
	}
});
