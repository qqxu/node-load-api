 /**
  * @description: 读本地excel 文件，删除第一行（标题），取第一列的所有数据，生成数组
  */
 const readFirstRow = (filePath) => {
	const xlsx = require('node-xlsx');
	var sheets = xlsx.parse(filePath);

	return new Promise((resolve, reject) => {
		sheets.forEach(function(sheet){
			try {
				sheet['data'].shift();  // 删除第一行（标题）
				const allData = sheet['data'].map(row => (row[0]));
				resolve(allData); 
			} catch (e) {
				reject(e);
			}
		});
	})
}


/**
 * data: [[orderNo, name], ['111', 'name1'], ['222', 'name2']]
 */
 const saveToExcel = async (data, fileName, folderName) => {
	const xlsx = require('node-xlsx');
	const fs = require('fs');
	var path = require('path');

	const buffer = xlsx.build([{name: fileName, data: data}]);
	let completePath = path.join(__dirname, folderName, fileName);
	
	await fs.writeFileSync(completePath, buffer);
}


/**
 * @description: 读取excel中的内容，去除第一行(标题)
 * 原来内容：[['订单号', '优惠券'], ['111', 'name1'], ['222', 'name2']]
 * 处理后：[['111', 'name1'], ['222', 'name2']]
 */
 const readContentFromExcel = (filePath) => {
    const xlsx = require('node-xlsx');
	var sheets = xlsx.parse(filePath);

	return new Promise((resolve, reject) => {
		sheets.forEach(function(sheet){
			try {
                sheet['data'].shift();  // 删除第一行（标题）
				const allData = sheet['data'];
				resolve(allData); 
			} catch (e) {
				reject(e);
			}
		});
	})
}



// 声明多个module
module.exports = {
	saveToExcel,
	readFirstRow,
    readContentFromExcel,
}