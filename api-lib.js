const utilLib = require('util');
const fs = require('fs');
const readFile = utilLib.promisify(fs.readFile);

const commonLib = require('./common-lib.js');

/**
 * @description: 每隔  tiemout 时间，一次并发num数量的请求, 最终获得arr所有的api结果
 */
 const getApiResult = async (arr, num, timeout) => {
	const configJson = await readFile('./config.json');
	const { API, COOKIE } = JSON.parse(configJson);
	const len = arr.length;
	let result = [];
	const aList = commonLib.splitArray(arr, num);
	for (let i = 0; i < aList.length;i++) {
		const aRes = await delayFun(aList[i],timeout, API, COOKIE);
		// console.log('当前处理项：', aRes);
		result = result.concat(aRes);
		const haveDone = result.length;
		console.log(`已经完成的个数: ${result.length}, 剩余待处理的个数: ${len - haveDone}`);
	}
	return result;
}

/**
 * @description:加上延迟，以避免高频请求，导致被发现非人工查询 
 * 
 */
const delayFun = (list, timeout, api, cookie) => {
	return new Promise(resolve => {
		setTimeout(async ()=> {
			const aListResult = await loadApiList(list, api, cookie);
			resolve(aListResult);
		}, timeout);
	});
}

/**
 * @description: 利用 Promise.all 实现请求并发
 */
const loadApiList = async (list, api, cookie) => (await Promise.all(list.map(orderNo => getByOrderNo(orderNo, api, cookie))));


/**
 * @description: 根据接口响应，格式化数据， COOKIE 取全局变量
 */
const  getByOrderNo = async (orderNo, api, cookie) => {
	const resp = await getApi({ api: `${api}${orderNo}`, cookie });
	
	let couponData = resp.data ? resp.data.shopCouponPromotionViewDTOs : [];
	let errTips = '';
	if (!couponData) {
		console.error(`出错了哦！当前订单号是：${orderNo}, resp.data`, resp.data);
		couponData = [];
		errTips = '出错了哦，请手动查询'
	}
	const allPromotionName = couponData.map(itm => itm.promotionName).join('----');
	return ({
		orderNo: orderNo,
		promotionName: allPromotionName,
		errTips: errTips,
	});
}

const getApi = ({ api, cookie }) => {
	const axios = require('axios');
	const iconv = require('iconv-lite');
	return new Promise((resolve, reject) => {
		axios({
			method: 'get',
			url: api,
			responseType: 'arraybuffer',
			headers: {
				"content-type": "application/json",
				"Cookie": cookie,
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
				"referer": "https://smf.taobao.com/promotionmonitor/index.htm",
				"sec-ch-ua": 'Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"timeout": 1000
			},
		  }).then((response) => {
				const str = iconv.decode(Buffer.from(response.data), 'gb2312');
				const html = iconv.encode(str, 'utf8').toString();
				
				const obj = JSON.parse(html);
				resolve(obj);
			})
			.catch((err) => {
				reject(err)
			})
	});
}




// 声明多个module
module.exports = {
	getApiResult,
    getApi
}