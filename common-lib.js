/**
 * input: splitArray([1, 2, 3, 4, 5], 2)
 * output: [[1, 2], [3, 4], [5]]
 */
 const splitArray = (arr = [], num) => {
	const temp = arr.reduce((acc, cur, idx, origin) => {
	  const { count } = acc;
	  if (count === idx) {
		acc.result.push(origin.slice(count, count + num));
		acc.count = count + num;
	  }
	  return acc;
	}, {
	  result: [],
	  count: 0
	});
	return temp.result;
};


/**
 * @description: 格式化数据, 用以存到 excel中，数组的第一个元素为 表格的第一行 作为 标题
 * [{ key1: 1, 'key2': 2 }, { key1: 3, 'key2': 4 }]
 * 
 * [[key1, key2], [1, 2], [3, 4]];
 */
 const formatData = (arr) => {
	if(arr.length === 0) {
		return [];
	} 
  let sheetData = [];
  let fields = [];
  Object.keys(arr[0]).forEach(field => {
	  fields.push(field);
  })
  arr.forEach(itm => {
	  let ele = [];
	  fields.forEach(field => {
		  ele.push(itm[field]);
	  })
	  sheetData.push(ele);
  })
  sheetData.unshift(fields);
  return sheetData;
}



/**
 * @description: 输出耗时
 * @param {*}
 * @return {*}
 */
 const printConsumeTime = (startTime) => {
	const millisecond = Date.now() - startTime;
	const minute = millisecond / 1000 / 60; // 分钟
	console.log(`耗时：${minute}分钟 `);
}




// 声明多个module
module.exports = {
	splitArray,
	formatData,
	printConsumeTime
}