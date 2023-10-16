const http = require('http')
const htmlRender = require('./src/html.js')
const fs = require('fs');
const path = require('path');

const server = http.createServer();

function writeHtml(funApplyFunList, staticList) {
  server.on('request',(req,res) => {
    //设置响应头
    // index.js  / react.js
    if (req.url === '/index.js') {
      res.setHeader("Content-Type", 'application/javascript')
      res.end(fs.readFileSync(path.resolve(__dirname,'./src/index.js'), 'utf-8'));
      return ;
    }

    //设置响应内容
    res.write(htmlRender('./index.js'),() => {console.log('服务已启动，请查看http://localhost:2746/')})
    //响应结束
    res.end()
  }).listen(2746)
}

module.exports = {
  writeHtml
}