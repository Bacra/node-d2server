/**
 * 创建队列来管理任务
 * 
 * 使用工程模式创建，方便start等方法的赋值
 * 暂时一个队列只执行一次，后期可能需要增加reset方法
 * 
 * @param  {Function} endCall 队列结束时运行的函数
 * @return {JSON}             操作函数集合
 */
module.exports = function(endCall) {
	var list = [],
		index = -1,
		endFunc = function(){
			index = -1;
			if (endCall) endCall();
		},
		nextFunc = function(){
			if (++index < list.length) {
				list[index](nextFunc, endFunc);
			} else {
				endFunc();
			}
		};

	return {
		'join': function(callback){
			list.push(callback);
		},
		'start': function(){
			nextFunc();
		},
		'end': endFunc
	};
};
