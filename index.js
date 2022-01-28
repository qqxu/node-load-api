var express = require('express');
var app = express();
var writeExcel = require('./write-excel');
var writeConfig = require('./write-config');

// 访问静态文件 https://www.expressjs.com.cn/starter/static-files.html
app.use('/public', express.static(__dirname + '/public'));  

app.post('/upload', function(req, res) {
  writeExcel(req, res, function() {
    if (req.fileValidationError) {
      res.status(500).json({ message: '数据格式有误' }); // http://expressjs.com/en/5x/api.html#res
      return;
    }
    if (!req.body.cookie) {
      res.status(500).json({ message: '数据缺失' }); // http://expressjs.com/en/5x/api.html#res
      return;
    }
    writeConfig(req.body.cookie); // 将数据写入json
    convert(req, res);
    res.status(200).json({ message: 'ok' });
  });
});

function convert (req, res) {
  const fork = require('child_process').fork;
  fork('./main.js');  // 开启子进程
}

app.listen(3000);
