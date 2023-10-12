const http = require('http')

let html = ''
const funcItemList = []
let otherFuncItemList = {}

const server = http.createServer();

function writeHtml(funApplyFunList, staticList) {
  Object.keys(funApplyFunList).forEach(element => {
    if(!staticList.includes(element)) {
      html += getFuncItem(element,funApplyFunList[element])
    }
  });
  funcItemList.forEach(item => {
    if(otherFuncItemList[item]) {
      html += otherFuncItemList[item]
    }
  })
  html += getScript()
  server.on('request',(req,res) => {
    //设置响应头
    res.setHeader("Content-Type", 'text/html; charset=utf-8')
    //设置响应内容
    res.write(html,() => {console.log('服务已启动，请查看http://localhost:2746/')})
    //响应结束
    res.end()
  }).listen(2746)
}

function getScript() {
  let result = '<script>';
  funcItemList.forEach((item,index) => {
    result += `
    const list${item + index} = document.getElementsByClassName("${item}")
    try{
      if(list${item + index}) {
        for(let i=0; i<list${item + index}.length; i++) {
          list${item + index}[i].onclick = function() {
            window.scrollTo(0, ${index} * 380)
          };
        }
      }
    }catch{console.log('err')}
    `
  })
  result += '</script>'
  return result;
}

function getFuncItem(funcName, funcItem, isWrite) {
  if(!funcItem) {
    return '';
  }
  let {funcbody , level, params} = funcItem;
  if(level < 3) {
    return '';
  }
  if(isWrite !== false) {
    funcItemList.push(funcName)
  }
  let funcItemEjs = `<h2>${funcName}</h2>`;
  if(funcbody && funcbody.indexOf('=>') === -1) {
    funcbody = `(${params.toString()}) => ` + funcbody
  }else{
    funcbody = ''
  }
  funcbody = funcbody.replaceAll(' ',`&ensp;`);
  funcbody = funcbody.replaceAll('\r\n',`<br />`);
  funcItemEjs += `<div style="display:flex;height:300px;">`
  funcItemEjs += `<div style="background:#9696961a;width:400px;height:200px;overflow:scroll">${funcbody}</div>`
  funcItemEjs += getFuncPath(funcItem.publicFunclist)
  funcItemEjs += getFuncPath(funcItem.otherFuncList)
  funcItemEjs += getFuncPath(funcItem.ownFuncList)
  funcItemEjs += `</div>`
  funcItemEjs += `<hr/>`
  return funcItemEjs
}

function getFuncPath(funcList, parent, isWrite) {
  let result = '<ul>'
  if(Array.isArray(funcList)) {
    funcList.forEach(item => {
      result += `<li class=${item} style="color:blue;height:30px;cursor:pointer">${item}</li>`;
      if(parent?.[item]) {
        result += getFuncPath(parent[item].ownFuncList, parent);
        result += getFuncPath(parent[item].otherFuncList, {}, false);
      }
    })
  }else{
    for(let propName in funcList) {
      if(funcList[propName] && !funcList[propName].bHidden) {
        result += `<li class=${propName} style="color:blue;height:30px;cursor:pointer;">${propName}</li>`;
        if(funcList[propName].otherFuncList) {
          result += getFuncPath(funcList[propName].otherFuncList);
        }
        if(funcList[propName].ownFuncList) {
          result += getFuncPath(funcList[propName].ownFuncList, funcList);
        }
      }
      const otherHtml = getFuncItem(propName, funcList[propName], isWrite) + '\r\n';
      otherFuncItemList[propName] = otherHtml;
    }
  }
  return result + '</ul>'
}

module.exports = {
  writeHtml
}