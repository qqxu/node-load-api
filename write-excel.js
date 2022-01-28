
// https://www.npmjs.com/package/multer
var multer = require('multer');

// MIME_types 列表 https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
var FILE_TYPES = [
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv', // csv
];

// 存储目标目录及文件名
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'originData/')
  },
  filename: function (req, file, cb) {
    cb(null, 'orderNo.xlsx');
  }
});

// 过滤文件的上传类型
function fileFilter (req, file, cb) {
  if (!FILE_TYPES.includes(file.mimetype)) {
    req.fileValidationError = 'err type'; // 错误话术
    return cb(null, false); // 上传失败
   }
   cb(null, true); // 上传成功
}

var writeExcel = multer({ 
  storage: storage, 
  fileFilter: fileFilter
}).single('file'); // 对应 formData 的 field

module.exports = writeExcel;