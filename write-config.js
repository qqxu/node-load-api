const fs = require('fs');
const API = "https://smf.taobao.com/promotionmonitor/orderPromotionQuery.htm?orderNo=";

function writeConfig (cookie) {
  const dataObj = {
    API,
    COOKIE: cookie,
  };
  fs.writeFileSync('config.json', JSON.stringify(dataObj, null, 2));
}

module.exports = writeConfig;