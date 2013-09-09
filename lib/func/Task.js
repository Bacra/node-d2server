/**
 * 将多个异步任务指向同一结束回调函数
 * 
 * 使用工程模式创建，方便start等方法的赋值
 * 暂时一个队列只执行一次，后期可能需要增加reset方法
 * 
 * @param  {Function} endCall 队列结束时运行的函数
 * @return {JSON}             操作函数集合
 */
module.exports = function(endCall){
	var waitTaskNum = 0,
		list = [],
		complete = function(){
			if (--waitTaskNum < 1) endCall(waitTaskNum);
		};

	return {
		'add': function(callback){
			list.push(callback);
		},
		'start': function(){
			waitTaskNum = list.length;
			list.forEach(function(func){
				func(complete);
			});
		},
		'complete': complete,		// 方便获取到这个方法，与query配合使用的时候，不能在query start之后再去拿complate
		'end': function(){
			endCall(waitTaskNum);
		}
	};
};

