const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const os = require('os');
const { noApplyFuncList, yydsFunc } = require('./static')
const { writeHtml } = require('./writeHtml')

const alowSaveFuncList = ['ObjectMethod','ClassProperty', 'ClassMethod', 'FunctionDeclaration']

let topPath = ''
let nowPath = ''
let extrFuncName;

//用于保存组件中的静态变量
const staticList = []


function getFileString() {
  let path = process.argv[2];
  if(process.argv[3]) {
    extrFuncName = process.argv[3].replace('funName=', '');
  }
  path = path.replace('path=', '');
  nowPath = path;
  topPath = path;
  return fs.readFileSync(path, 'utf-8');
}

//将拿到的file转换为AST语法树
function getFileAST(file) {
  const AST = parser.parse(file,{
    sourceType: 'module',
    plugins: ['jsx','js']
  });
  return AST
}

//获取通过import引入的模块
function getImportModule(file) {
  const AST = getFileAST(file);
  const importModule = {}
  traverse(AST, {
    ImportDeclaration(declaration) {
      const specifiers = declaration.node.specifiers;
      const source = declaration.node.source;
      const moduleList = specifiers.map(specifier => {
        return specifier.local.name
      })
      importModule[source.value] = moduleList;
    }
  })
  return importModule;
}

//用来处理state相关的变量
function dealState(itemNode, ownFuncList) {
  itemNode.traverse({
    ObjectProperty(objectProperty) {
      const leadingComments = objectProperty.node.leadingComments?.map(item => {
        return item.value
      })
      ownFuncList.add(`${objectProperty.node.key.name}: ${leadingComments?.toString() || '未标明'}`);
    }
  })
}

// 用来处理静态变量
function dealStatic(itemNode, funcName) {
  const arrowFunctionExpression = itemNode.node.value;

  if(arrowFunctionExpression && arrowFunctionExpression.type !== 'ArrowFunctionExpression') {
    staticList.push(funcName)
  }
}

// 用来处理方法参数
function dealParams(itemNode, params) {
  let paramsList;
  if(itemNode.node.type === 'FunctionDeclaration' || itemNode.node.type === 'ArrowFunctionExpression') {
    paramsList = itemNode.node?.params || [];
    params = paramsList.map(item => {
      return item.name
    })
  }else{
    paramsList = itemNode.node.value?.params || [];
    params = paramsList.map(item => {
      return item.name
    })
  }

  return params
}

//用来保存方法的调用栈
function dealCallback(itemNode, importModule, otherFuncList, yydsFuncList, ownFuncList) {
  itemNode.traverse({
    CallExpression(callExpression) {
      const callName = callExpression.node.callee.name || callExpression.node.callee.property?.name;
      if(!noApplyFuncList.includes(callName)) {
        if(isFromImportMoudle(callName, importModule)) {
          otherFuncList.add(callName);
        }else if(yydsFunc.includes(callName)) {
          yydsFuncList.add(callName)
        }else{
          ownFuncList.add(callName)
        }
      }
    }
  })
}

// 获取注释
function dealComline(itemNode, commentLines) {
  const { leadingComments} = itemNode.node;
  if(leadingComments) {
    leadingComments.map(item => {
      commentLines.push(item.value)
    })
  }
}

// 获取方法体
function dealFuncBody(itemNode, file) {
  const body = itemNode.node.body || itemNode.node.value
  let funcbody;
  if(body?.start && body.end) {
    funcbody = file.slice(body.start, body.end + 1)
  }
  return funcbody
}

//获取方法和方法之间的依赖关系，每个方法中使用了外部的哪个方法
function getClassFuncList(file, importModule, newPath) {
  const AST = getFileAST(file);
  const funApplyFunList = {};
  traverse(AST, {
    enter(itemNode) {
      // AST中的赋值关系，key为变量，value为值
      const funcName = itemNode.node.key?.name || itemNode.node.id?.name;
      //用来保存来自外部的方法
      const otherFuncList = new Set();
      //用于保存来自内部的方法
      const ownFuncList = new Set();
      //用于保存来自公共的方法
      const yydsFuncList = new Set();
      //用于保存方法的注释
      const commentLines = []
      //用于保存参数的列表
      let params = []
      //方法体
      let funcbody;
      //level
      let level;
      if(alowSaveFuncList.includes(itemNode.node.type)) {
        //用于保存state的状态管理变量
        if(funcName === 'state') {
          dealState(itemNode, ownFuncList)
        }
        dealStatic(itemNode, funcName)
        //计算方法的参数
        params = dealParams(itemNode, params)
        //用于保存方法的内部调用栈
        dealCallback(itemNode, importModule, otherFuncList, yydsFuncList, ownFuncList)
        //获取注释
        dealComline(itemNode, commentLines)
        //获取level
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        //获取方法体
        funcbody = dealFuncBody(itemNode, file)
        
        funApplyFunList[funcName] = {
          ownFuncList: Array.from(ownFuncList),
          yydsFuncList: Array.from(yydsFuncList),
          path: newPath || topPath,
          funcbody,
          level
        }
        funApplyFunList[funcName].commentLines = commentLines;
        funApplyFunList[funcName].params = params;
        funApplyFunList[funcName].otherFuncList = {}
        otherFuncList.forEach(item => {
          funApplyFunList[funcName].otherFuncList[item] = null
        })
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath)
      }else if(itemNode.node.type === 'ObjectProperty' && ['FunctionExpression','ArrowFunctionExpression'].includes(itemNode.node.value.type)) {
        params = dealParams(itemNode, params);
        dealCallback(itemNode, importModule, otherFuncList, yydsFuncList, ownFuncList);
        dealComline(itemNode, commentLines)
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        //获取方法体
        funcbody = dealFuncBody(itemNode, file)
        
        funApplyFunList[funcName] = {
          ownFuncList: Array.from(ownFuncList),
          yydsFuncList: Array.from(yydsFuncList),
          path: newPath || topPath,
          funcbody,
          level
        }
        funApplyFunList[funcName].commentLines = commentLines;
        funApplyFunList[funcName].params = params;
        funApplyFunList[funcName].otherFuncList = {}
        otherFuncList.forEach(item => {
          funApplyFunList[funcName].otherFuncList[item] = null
        })
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath)
      }
    }
  })
  return funApplyFunList
}

//用于判断是否来自外部
function isFromImportMoudle(callName, importModule) {
  for(let moudleName in importModule) {
    if(importModule[moudleName].includes(callName)) {
      return moudleName;
    }
  }
  return false
}

//查询通过外部引入的方法，在哪个路径里面
function appendOtherFunApply(otherFuncList, importModule, childNowPath) {
  Object.keys(otherFuncList).forEach(func => {
    const filePath = childNowPath || nowPath
    const moudleName = isFromImportMoudle(func, importModule);
    if(!moudleName) {
      throw new Error('错误的执行结果')
    }
    let newPath;
    //判断是否是通过绝对路径进行引入
    if(moudleName.indexOf('.') > -1) {
      newPath = path.resolve(filePath, '../' + moudleName);
    }else{
      return;
    }
    if(!newPath.endsWith('.js')) {
      newPath = newPath + '.js'
    }
    const file =  fs.readFileSync(newPath, 'utf-8');
    const funApplyFunList = getFunApplyList(file, newPath);
    otherFuncList[func] = funApplyFunList[func];
    //用来处理外部方法调用外部的内部方法
    deayOtherFunc(funApplyFunList, func, otherFuncList);
  });
}

//用来处理外部方法调用外部的内部方法
function deayOtherFunc(funApplyFunList, func, otherFuncList) {
  if(funApplyFunList[func].ownFuncList.length > 0) {
    funApplyFunList[func].ownFuncList.forEach(item => {
      if(funApplyFunList[item]) {
        otherFuncList[item] = funApplyFunList[item];
        otherFuncList[item].bHidden = true;
        if(funApplyFunList[item].ownFuncList) {
          deayOtherFunc(funApplyFunList, item, otherFuncList)
        }
      }
    })
  }
}

//获取当前file的方法调用关系
function getFunApplyList(file, newPath) {
  const importModule = getImportModule(file);
  const funApplyFunList = getClassFuncList(file, importModule, newPath);
  return funApplyFunList;
}

function beautifulCode(obj) {
  if(extrFuncName) {
    obj = obj[extrFuncName]
  }
  let str = JSON.stringify(obj,"","\t")
  return str
}

//生成文档
function writeWord(obj) {
  let word = '';
  word += `## 组件中的state状态管理${os.EOL}`
  const stateList = obj.state?.ownFuncList;
  (stateList || []).forEach(item => {
    word += ( item + os.EOL)
  })
  word += `## 组件中的static状态管理${os.EOL}`
  // console.log(staticList);
  staticList.forEach(staticItem => {
    if(staticItem !== 'state') {
      word += ( `${staticItem}: ${obj[staticItem].commentLines?.toString() || '未标注'}${os.EOL}`)
    }
  })
  word += `## 组件中的function管理${os.EOL}`
  word += appendOtherFunc(obj, 0)
  fs.writeFileSync(path.resolve(topPath, '../apply.md'), word)
}

function appendhidden(index) {
  let str = '###';
  for(let i=0;i <index; i++) {
    str += '#'
  }
  return str;
}

//将注释的字符串转换为表格形式
function getCommentLinesTable(comline) {
  let tableString = `|参数名|参数类型|描述|\r\n`;
  tableString = tableString += `|--|--|--|\r\n`;
  if(comline.length === 1) {
    let comlineList = comline[0].split('\r\n');
    comlineList = comlineList.map(item => {
      return item.replaceAll(' ','')
    })
    const returns = comlineList.find(item => item.indexOf('@returns') > -1);
    let returnString;
    if(returns) {
      const returnIndex = returns.indexOf('@returns');
      returnString = returns.slice(returnIndex + 8);
    }
    comlineList = comlineList.filter(item => {
      return item.indexOf('@param') > -1
    })
    comlineList.forEach(item => {
      const typeIndex = item.indexOf('@param{*');
      const scipeIndex = item.indexOf('}')
      const type = item.slice(typeIndex + 8,scipeIndex);
      let scripe = item.slice(scipeIndex + 1);
      const nameIndex = scripe.indexOf(':');
      const name = scripe.slice(0, nameIndex);
      scripe = scripe.slice(nameIndex + 1);
      tableString += `|${name}|${type}|${scripe}\r\n`
    })
    if(returnString) {
      tableString += `|返回值|any|${returnString}\r\n`
    }
  }
  return tableString
}

function appendOtherFunc(obj, lowNum, parentName) {
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
      word += `${propName}${os.EOL}`;
      //标记方法的注释
      word += `**方法注释**：`
      if(!func || func.commentLines.length === 0) {
        word += `未标注${os.EOL}`
      }else{
        word += os.EOL;
        word += getCommentLinesTable(func.commentLines)
      }

      //标记内部方法的调用
      word += `**内部方法**: `;
      if(!func || !func.ownFuncList || Object.keys(func.ownFuncList).length === 0) {
        word += `未调用${os.EOL}`
      }else{
        word += os.EOL
      }
      if(func && func.ownFuncList) {
        func.ownFuncList.forEach((ownFunc,index) => {
          word += ` (${index + 1}) ${ownFunc}${os.EOL}`
        })
      }

      //标记公共方法的调用
      word += `**公共方法**: `;
      if(!func || !func.yydsFuncList || Object.keys(func.yydsFuncList).length === 0) {
        word += `未调用${os.EOL}`
      }else{
        word += os.EOL
      }
      if(func && func.yydsFuncList) {
        func.yydsFuncList.forEach((ownFunc,index) => {
          word += ` (${index + 1}) ${ownFunc}${os.EOL}`
        })
      }

      //标记方法的外部调用
      word += `**外部方法**: `
      if(!func || Object.keys(func.otherFuncList).length === 0) {
        word += `未调用${os.EOL}`
      }else{
        word += os.EOL
      }
      if(func && func.otherFuncList) {
        Object.keys(func.otherFuncList).forEach((otherFunc,index) => {
          word += ` (${index + 1}) ${otherFunc} **<${func.otherFuncList[otherFunc].path}>**${os.EOL}`
        })
      }
    }
  }
  return word
}

function main() {
  const file = getFileString();
  const funApplyFunList = getFunApplyList(file)
  writeWord(funApplyFunList)
  fs.writeFileSync(path.resolve(topPath, '../apply.json'), beautifulCode(funApplyFunList))
  writeHtml(funApplyFunList, staticList)
}

main()


module.exports = {
  getFileString
}
