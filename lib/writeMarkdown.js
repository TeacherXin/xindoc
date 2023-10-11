const fs = require('fs')
const path = require('path')
//生成文档

let topPath;
function writeWord(obj, staticList, toppath) {
  topPath = toppath
  let word = '';
  const stateList = obj.state?.ownFuncList;
  if(stateList && stateList.length > 0) {
    word += `## 组件中的state状态管理\n`
    console.log(stateList);
    (stateList || []).forEach(item => {
      word += ( item + '\n')
    })
  }
  if(staticList.length > 0) {
    word += `## 组件中的static状态管理\n`
    staticList.forEach(staticItem => {
      if(staticItem !== 'state') {
        word += ( `${staticItem}: ${obj[staticItem].commentLines?.toString() || '未标注'}\n`)
      }
    })
  }
  word += `## 组件中的function管理\n`
  word += appendOtherFunc(obj, 0, '', staticList)
  fs.writeFileSync(path.resolve(topPath, '../apply.md'), word)
}

function appendOtherFunc(obj, lowNum, parentName, staticList) {
  let word = ''
  for(let propName in obj) {
    if(staticList.includes(propName)) {
      continue;
    }
    if(obj[propName].level < 3 && lowNum === 0) {
      continue;
    }
    const index = Object.keys(obj).indexOf(propName) + 1;
    const func = obj[propName];
    if(propName !== 'state') {
      if(lowNum > 0) {
        word += `${appendhidden(lowNum)} <调用者：${parentName}>`
      }else{
        word += `### (${index}) `
      }
      word += `${propName}\n`;
      //标记方法的注释
      word += `**方法注释**：`
      if(!func || func.commentLines.length === 0) {
        word += `未标注\n`
      }else{
        word += getCommentLinesTable(func.commentLines)
      }

      //标记内部方法的调用
      word += `**内部方法**: `;
      if(!func || !func.ownFuncList || Object.keys(func.ownFuncList).length === 0) {
        word += `未调用\n`
      }else{
        word += '\n'
      }
      if(func && func.ownFuncList) {
        func.ownFuncList.forEach((ownFunc,index) => {
          word += ` (${index + 1}) ${ownFunc}\n`
        })
      }

      //标记公共方法的调用
      word += `**公共方法**: `;
      if(!func || !func.yydsFuncList || Object.keys(func.yydsFuncList).length === 0) {
        word += `未调用\n`
      }else{
        word += '\n'
      }
      if(func && func.yydsFuncList) {
        func.yydsFuncList.forEach((ownFunc,index) => {
          word += ` (${index + 1}) ${ownFunc}\n`
        })
      }

      //标记方法的外部调用
      word += `**外部方法**: `
      if(!func || Object.keys(func.otherFuncList).length === 0) {
        word += `未调用\n`
      }else{
        word += '\n'
      }
      if(func && func.otherFuncList) {
        Object.keys(func.otherFuncList).forEach((otherFunc,index) => {
          word += ` (${index + 1}) ${otherFunc} **<${func.otherFuncList[otherFunc].path}>**\n`
        })
      }
    }
  }
  return word
}

//将注释的字符串转换为表格形式
function getCommentLinesTable(comline) {
  let tableString = `|参数名|参数类型|描述|\n`;
  tableString = tableString += `|--|--|--|\n`;
  if(comline.length === 1) {
    let comlineList = comline[0].split('\n');
    const comlineMessage = comlineList[1].replaceAll(' ','').replaceAll('*','');
    tableString = comlineMessage + '\n' + tableString
    const returns = comlineList.find(item => item.indexOf('@returns') > -1);
    let returnType;
    let returnString;
    if(returns) {
      const returnIndex = returns.indexOf('@returns');
      returnString = returns.slice(returnIndex + 8);
      const returnTypeLeftIndex = returnString.indexOf('{')
      const returnTypeRightIndex = returnString.indexOf('}')
      returnType = returnString.slice(returnTypeLeftIndex + 1, returnTypeRightIndex)
      returnString = returnString.slice(returnTypeRightIndex + 1).replaceAll(' ','')
    }
    const paramList = comlineList.filter(item => {
      return item.indexOf('@param') > -1
    })
    const nameList = []
    paramList.forEach(item => {
      const typeIndex = item.indexOf('@param {');
      const scipeIndex = item.indexOf('}')
      const type = item.slice(typeIndex + 8,scipeIndex);
      let scripe = item.slice(scipeIndex + 2);
      const nameIndex = scripe.indexOf(' ');
      let name = scripe.slice(0, nameIndex);
      const parentIndex = nameList.findIndex(_item => item.indexOf(_item) > -1);
      if(parentIndex > -1) {
        name = nameList[parentIndex] + '.' + name
      }
      nameList.push(name);
      scripe = scripe.slice(nameIndex + 1);
      tableString += `|${name}|${type}|${scripe}\n`
    })
    if(returnString) {
      tableString += `|返回值|${returnType}|${returnString}\n`
    }
  }
  return tableString
}

module.exports = {
  writeWord
}
