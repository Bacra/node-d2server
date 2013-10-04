/**
 * 将数字转化为指定字符序列的字符串（n进制转化）
 * @param  {Number} num       需要转化的数字
 * @param  {Array}  strArr    序列表
 * @param  {Number} strArrLen 从系列表中提取的长度
 * @return {String}           转化之后的字符串
 */
function cutInt(num, strArr, strArrLen) {
	return num < strArrLen ? strArr[num] : cutInt(Math.floor(num/strArrLen), strArr, strArrLen) + strArr[num%strArrLen];
}

/**
 * 初始化提供的序列表
 * @type {Array}
 */
cutInt.charArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '_', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '$', '&', '%', '=', '+'];


module.exports = cutInt;

