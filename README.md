### GET 类型的API爬虫

需求：读取本地excel中获得【订单号列表】，依次使用【订单号】调用查询API，读取API响应中的【优惠券名称】，最终输出excel。

### 需求梳理

页面A链接：https://smf.taobao.com/index.htm?spm=xxxxxx&menu=xxxxxx&module=xxxxxx

页面A是某猫商家的营销中心，访问页面A会跳转至登录, 输入【天猫商家】的账号+密码登录成功后，再次访问页面A，显示如下

查询一个订单号数据，xxxxxx，打开控制台 network面板，发现关键接口 B（接口响应中有优惠券名称） https://smf.taobao.com/promotionmonitor/orderPromotionQuery.htm?_tb_token_=xxxxxx&_input_charset=utf-8&orderNo=xxxxxx

接口 B 是GET请求，直接新开页面，在浏览器中输入接口B，可以看到接口响应

cookie中包含会话登录信息，因此可以直接新开页面访问链接，而无需再次登录。


### 从本地excel中读数据

```
/**
 * 读本地excel 文件，取第一列的所有数据，生成数组
 */
const readFirstRow = (filePath) => {
    const xlsx = require('node-xlsx');
    var sheets = xlsx.parse(filePath);

    return new Promise((resolve, reject) => {
        sheets.forEach(function(sheet){
            try {
                const allData = sheet['data'].map(row => (row[0]));
                resolve(allData); 
            } catch (e) {
                reject(e);
            }
        });
    })
}

```

### 调用API

利用axios 发起请求
利用iconv-lite 解决中文乱码的问题

```

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


```


根据接口响应，格式化数据，此处的 COOKIE 取全局变量

```

const  getNameByOrderNo = async (orderNo) => {
    const resp = await getApi({ api: `${API}${orderNo}`, cookie: COOKIE });
    const arr = resp.data.shopCouponPromotionViewDTOs;
    const allPromotionName = arr.map(itm => itm.promotionName).join('----');
    return ({
        orderNo: orderNo,
        promotionName: allPromotionName
    });
}

```

### 请求并发
利用 Promise.all 实现请求并发

```
const loadApiList = async (list) => (await Promise.all(list.map(orderNo => getByOrderNo(orderNo))));

```

### 控制请求并发数量

- 订单号列表非常长，考虑分批发起请求，以减少并发数量
- 加上延迟，以避免高频请求，导致被发现非人工查询


```

const delayFun = (list, timeout) => {
    return new Promise(resolve => {
        setTimeout(async ()=> {
            const aListResult = await loadApiList(list);
            resolve(aListResult);
        }, timeout);
    });
}

```

对api长列表进行分割

```
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

```

对分割后的api列表依次调用接口获得数据

```
const getAllApiResult = async (arr, num, timeout) => {
    const len = arr.length;
    let result = [];
    const aList = splitArray(arr, num);
    for (let i = 0; i < aList.length;i++) {
        const aRes = await delayFun(aList[i],timeout);
        result = result.concat(aRes);
    }
    return result;
}


```

将所有订单号列表分割成每2个订单号为一组数据，对每组数据进行并发请求，两组数据之前请求延迟5秒。

```
const result = await getAllApiResult(allOrderNo, 2, 5000);
```

### 导出excel

导出到excel

```

/**
 * data: [[orderNo, name], ['111', 'name1'], ['222', 'name2']]
 */
const saveToExcel = async (data, fileName) => {
    const xlsx = require('node-xlsx');
    const fs = require('fs');
    const buffer = xlsx.build([{name: fileName, data: data}]);
    await fs.writeFileSync(`${fileName}.xlsx`, buffer);
}

```


### 分批请求

一次性处理多条订单，任一订单处理失败，都无法正常保存，因此分批处理，成功一批保存到excel，最后合并所有的excel

```
/**
 * @description: 总订单量 分批请求数据每批(num)订单，并存储到本地文件
 */
const batchSaveFile = async (arr, num) => {
    const aList = util.splitArray(arr, num);
    for (let i = 0; i < aList.length;i++) {
        console.log('当前批次', i);
        const data = await getAllApiResult(aList[i], 2, 5000);
        util.saveToExcel(util.formatData(data), `out${i}.xlsx`);
    }
    return aList.length;
}  

```


### 合并所有exxcel 的内容
读取每一个excel的内容，不含标题

```

/**
 * @description:  合并所有excel 的内容
 */
const getAllResult = async (len) => {
    let result = [];
    for(let i = 0; i < len; i++) {
        const data = await util.readContentFromExcel(`./batch_result/out${i}.xlsx`); // 读取每一个excel的内容，不含标题
        result = result.concat(data);
    }
    return result;
}

```

### 合并excel

输出合并后的excel

```
/**
 * @description: 合并所有excel, 并输出合并后的 excel
 */
async function joinBatchResult(len) {
    let result = [];
    result.push(['订单号', '优惠券']);  // 添加标题

    const allData = await getAllResult(len); //  [['111', 'name1'], ['222', 'name2']]
    result = result.concat(allData); //  [['订单号', '优惠券'], ['111', 'name1'], ['222', 'name2']]
    util.saveToExcel(result, 'all.xlsx');
}
   
```