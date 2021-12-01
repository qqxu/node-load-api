
const path = require('path');

const excelLib = require('./excel-lib.js');
const commonLib = require('./common-lib.js');
const apiLib = require('./api-lib.js');

const ORIGIN_FILE = './originData/orderNo.xlsx';  // 原始订单列表
const BATCH_FOLDER_NAME = 'batch_result';  // 分批获取接口的数据存放excel的目录
const FINAL_FOLDER = 'final_output';  // 最终结果输出的文件目录


const startTime = Date.now(); // 开始计时


/**
 * @description:  合并所有excel 的内容
 */
 const joinExcels = async (len) => {
    let result = [];
    for(let i = 0; i < len; i++) {
        const completePath = path.join(__dirname,
            `${BATCH_FOLDER_NAME}`,
            `out${i}.xlsx`)
    
        const data = await excelLib.readContentFromExcel(completePath); // 读取每一个excel的内容，不含标题
        result = result.concat(data);
    }
    return result;
}

/**
 * @description: 合并所有excel, 并输出合并后的 excel
 */
async function joinBatchResult(len) {
    let result = [];
    result.push(['订单号', '优惠券']);  // 添加标题

    const allData = await joinExcels(len); //  [['111', 'name1'], ['222', 'name2']]
    result = result.concat(allData); //  [['订单号', '优惠券'], ['111', 'name1'], ['222', 'name2']]
    excelLib.saveToExcel(result, 'all.xlsx', FINAL_FOLDER);
}


/**
 * @description: 重置文件夹
 * 清空上一次结果
 */
const initFolder = () => {
	const shell = require('shelljs')

	shell.exec(`rm -rf ${BATCH_FOLDER_NAME}`);
	shell.exec(`mkdir -p ${BATCH_FOLDER_NAME}`);

	shell.exec(`rm -rf ${FINAL_FOLDER}`);
	shell.exec(`mkdir -p ${FINAL_FOLDER}`);
}


/**
 * @description: 从excel中获取所有的订单数据，过滤订单为空的数据
 */
const getOrderNoList = async () => {
	const orderNos = await excelLib.readFirstRow(ORIGIN_FILE); // 获取所有的订单数据
	const allOrderNo = orderNos.filter(itm => !!itm);
	return allOrderNo;
}


/**
 * @description: 总订单量 分批请求数据每批(num)订单，并存储到本地文件
 */
const batchSaveFile = async (arr, num) => {
	const aList = commonLib.splitArray(arr, num);
	const maxLen = aList.length;
	for (let i = 0; i < aList.length;i++) {
		console.log(`当前批次${i + 1}, 总批次${maxLen}`);
		const data = await apiLib.getApiResult(aList[i], 2, 5000);
		excelLib.saveToExcel(commonLib.formatData(data), `out${i}.xlsx`, BATCH_FOLDER_NAME);
	}
	return aList.length;
}  


async function main() {
	initFolder();
	
	const allOrderNo = await getOrderNoList();
	console.log(`过滤订单编号为空的数据，订单号总数量: ${allOrderNo.length}`);

	const maxLen = await batchSaveFile(allOrderNo, 30);
	commonLib.printConsumeTime(startTime);

	joinBatchResult(maxLen); // 合并所有excel	
}

main();
