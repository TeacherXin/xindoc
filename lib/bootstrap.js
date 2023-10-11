const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const os = require('os');
const { noApplyFuncList, yydsFunc } = require('./static')
const { writeHtml } = require('./writeHtml')
const { writeWord } = require('./writeMarkdown')

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
  return funcbody || ''
}

// 将所有的信息，综合处理，成为json的数据结构
function dealFuncAllrelation(argu) {
  const {funcName,funApplyFunList, ownFuncList, yydsFuncList, newPath, funcbody, level, commentLines, params, otherFuncList} = argu
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
        // 将所有的信息，综合处理，成为json的数据结构
        dealFuncAllrelation({funcName,funApplyFunList, ownFuncList, yydsFuncList, newPath, funcbody, level, commentLines, params, otherFuncList})
        //找到外部方法的函数依赖关系
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
        // 将所有的信息，综合处理，成为json的数据结构
        dealFuncAllrelation({funcName,funApplyFunList, ownFuncList, yydsFuncList, newPath, funcbody, level, commentLines, params, otherFuncList})
        //找到外部方法的函数依赖关系
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

function main() {
  const file = getFileString();
  const funApplyFunList = getFunApplyList(file)
  writeWord(funApplyFunList, staticList, topPath)
  fs.writeFileSync(path.resolve(topPath, '../apply.json'), beautifulCode(funApplyFunList))
  writeHtml(funApplyFunList, staticList)
}

main()


module.exports = {
  getFileString
}
