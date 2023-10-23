const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { noApplyFuncList, publiclist } = require('./static')
const { writeHtml } = require('./writeHtml')
const { writeWord } = require('./writeMarkdown')

const alowSaveFuncList = ['ObjectMethod','ClassProperty', 'ClassMethod', 'FunctionDeclaration']

let topPath = ''
let nowPath = ''
let extrFuncName;
let useEffectNum = 1

//用于保存组件中的静态变量
const staticList = []
const stateList = []
const refList = []

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
function dealState(funcName,itemNode, ownFuncList) {
  if(funcName === 'state') {
    itemNode.traverse({
      ObjectProperty(objectProperty) {
        const leadingComments = objectProperty.node.leadingComments?.map(item => {
          return item.value
        })
        stateList.push(`${objectProperty.node.key.name}: ${leadingComments?.toString() || '未标明'}`);
      }
    })
  }else{
    itemNode.traverse({
      VariableDeclaration(variableDeclaration) {
        const variableDeclarator = variableDeclaration.node.declarations[0]
        if(variableDeclarator?.id?.elements?.length === 2) {
          if(variableDeclarator?.init?.callee?.name === 'useState') {
            const leadingComments = variableDeclaration.node.leadingComments?.map(item => {
              return item.value
            })
            stateList.push(`${variableDeclarator.id.elements[0].name}: ${leadingComments?.toString() || '未标明'}`);
          }else if(variableDeclarator?.init?.callee?.name === 'useRef') {
            const leadingComments = variableDeclaration.node.leadingComments?.map(item => {
              return item.value
            })
            refList.push(`${variableDeclarator.id.elements[0].name}: ${leadingComments?.toString() || '未标明'}`);
          }
        }
      }
    })
  }
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
  if(['ExpressionStatement', 'FunctionDeclaration', 'ArrowFunctionExpression'].includes(itemNode.node.type)) {
    paramsList = itemNode.node?.params || [];
    params = paramsList.map(item => {
      return item.name
    })
  }else if(itemNode.node.type === 'VariableDeclaration') {
    paramsList = itemNode.node?.declarations?.[0]?.init.params || [];
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
function dealCallback(itemNode, importModule, otherFuncList, publicFunclist, ownFuncList) {
  itemNode.traverse({
    CallExpression(callExpression) {
      let callName = callExpression.node.callee.name || callExpression.node.callee.property?.name;
      if(!noApplyFuncList.includes(callName)) {
        if(isFromImportMoudle(callName, importModule)) {
          otherFuncList.add(callName);
        }else if(publiclist.includes(callName)) {
          publicFunclist.add(callName)
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
function dealFuncBody(funcName, itemNode, file, params) {
  let deepFlag = false;
  let closePkFlag = false;
  let body = itemNode.node.body || itemNode.node.value;
  if(itemNode.node.type === 'VariableDeclaration') {
    body = itemNode.node.declarations[0].init;
  }
  let funcbody;
  if(body?.start && body.end) {
    funcbody = file.slice(body.start, body.end)
  }
  if(funcbody.indexOf(funcName) > -1) {
    deepFlag = true
  }
  if(body?.body?.[0]?.type === 'ReturnStatement') {
    closePkFlag = true
  }
  if(params && !funcbody.includes('=>')) {
    funcbody = `(${params.toString()}) => ` + funcbody
  }
  return { funcbody, deepFlag, closePkFlag }
}

// 将所有的信息，综合处理，成为json的数据结构
function dealFuncAllrelation(argu) {
  const {funcName,funApplyFunList, ownFuncList, publicFunclist, newPath, funcbody, level, commentLines, params, otherFuncList,deepFlag, closePkFlag,asyncFlag} = argu
  funApplyFunList[funcName] = {
    ownFuncList: Array.from(ownFuncList),
    publicFunclist: Array.from(publicFunclist),
    path: newPath || topPath,
    funcbody,
    level,
    deepFlag,
    closePkFlag,
    asyncFlag
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
      let funcName = itemNode.node.key?.name || itemNode.node.id?.name;
      //用来保存来自外部的方法
      const otherFuncList = new Set();
      //用于保存来自内部的方法
      const ownFuncList = new Set();
      //用于保存来自公共的方法
      const publicFunclist = new Set();
      //用于保存方法的注释
      const commentLines = []
      //用于保存参数的列表
      let params = []
      //方法体
      let funcbody;
      //level
      let level;
      /**
       * 第一种情况：
       * 就是直接在外层定义的function，定义类中的function，定义在对象中的function（非赋值方式）
       * itemNode.node就是function
       */
      if(alowSaveFuncList.includes(itemNode.node.type)) {
        //用于保存state的状态管理变量
        dealState(funcName,itemNode, ownFuncList)
        dealStatic(itemNode, funcName)
        //计算方法的参数
        params = dealParams(itemNode, params)
        //用于保存方法的内部调用栈
        dealCallback(itemNode, importModule, otherFuncList, publicFunclist, ownFuncList)
        //获取注释
        dealComline(itemNode, commentLines)
        //获取level
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        //获取async状态
        const asyncFlag = itemNode.node.async;
        //获取方法体
        funcbody = dealFuncBody(funcName,itemNode, file, params).funcbody
        const { deepFlag, closePkFlag} = dealFuncBody(funcName,itemNode, file, params);
        // 将所有的信息，综合处理，成为json的数据结构
        const argus = {
          funcName,
          funApplyFunList,
          ownFuncList,
          publicFunclist,
          newPath,
          funcbody,
          level,
          commentLines,
          params,
          otherFuncList,
          deepFlag,
          closePkFlag,
          asyncFlag
        }
        dealFuncAllrelation(argus)
        //找到外部方法的函数依赖关系
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath)
      /**
       * 第二中情况：
       * 定义在对象中的function，不过是通过赋值的方式
       */
      }else if(itemNode.node.type === 'ObjectProperty' && ['FunctionExpression','ArrowFunctionExpression'].includes(itemNode.node.value.type)) {
        //获取async状态
        const asyncFlag = itemNode.node.value.async;
        params = dealParams(itemNode, params);
        dealCallback(itemNode, importModule, otherFuncList, publicFunclist, ownFuncList);
        dealComline(itemNode, commentLines)
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        //获取方法体
        funcbody = dealFuncBody(funcName,itemNode, file).funcbody
        const { deepFlag, closePkFlag} = dealFuncBody(funcName,itemNode, file, params);
        // 将所有的信息，综合处理，成为json的数据结构
        const argus = {
          funcName,
          funApplyFunList,
          ownFuncList,
          publicFunclist,
          newPath,
          funcbody,
          level,
          commentLines,
          params,
          otherFuncList,
          deepFlag,
          closePkFlag,
          asyncFlag
        }
        dealFuncAllrelation(argus)
        //找到外部方法的函数依赖关系
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath)
      /**
       * 第三种情况：
       * 在函数中通过赋值的方式来创建函数
       * 一般见于Rfc中的方法
       */
      }else if(itemNode.node.type === 'VariableDeclaration' && itemNode.node?.declarations[0]?.init?.type === 'ArrowFunctionExpression') {
        params = dealParams(itemNode, params);
        dealCallback(itemNode, importModule, otherFuncList, publicFunclist, ownFuncList);
        dealComline(itemNode, commentLines)
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        // 将所有的信息，综合处理，成为json的数据结构
        funcName = itemNode.node.declarations[0].id.name
        //获取方法体
        funcbody = dealFuncBody(funcName,itemNode, file, params).funcbody
        const { deepFlag, closePkFlag} = dealFuncBody(funcName,itemNode, file, params);
        // 将所有的信息，综合处理，成为json的数据结构
        const argus = {
          funcName,
          funApplyFunList,
          ownFuncList,
          publicFunclist,
          newPath,
          funcbody,
          level,
          commentLines,
          params,
          otherFuncList,
          deepFlag,
          closePkFlag,
        }
        dealFuncAllrelation(argus)
        //找到外部方法的函数依赖关系
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath)
      /**
       * 第四种情况：
       * useEffect这种Hook
       */
      }else if(itemNode.node.type === 'ExpressionStatement' && itemNode.node.expression?.callee?.name === 'useEffect') {
        dealCallback(itemNode, importModule, otherFuncList, publicFunclist, ownFuncList);
        funcName = `useEffect - ${useEffectNum}`;
        dealComline(itemNode, commentLines);
        const leveIndex = (commentLines[0] || '').indexOf('@level ');
        if(leveIndex > -1) {
          level = commentLines[0][leveIndex + 7];
        }else {
          level = 0;
        }
        // 将所有的信息，综合处理，成为json的数据结构
        const argus = {
          funcName,
          funApplyFunList,
          ownFuncList,
          publicFunclist,
          newPath,
          funcbody,
          level,
          commentLines,
          params,
          otherFuncList
        }
        dealFuncAllrelation(argus)
        //找到外部方法的函数依赖关系
        appendOtherFunApply(funApplyFunList[funcName].otherFuncList, importModule, newPath);
        const applyList = itemNode.node.expression.arguments[1]?.elements?.map(item => item.name || item.object.name + '.' + item.property.name);
        funApplyFunList[funcName].applyList = applyList;
        delete funApplyFunList[funcName].otherFuncList.useEffect;
        useEffectNum ++;
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
  if(!funApplyFunList[func]) {
    return ''
  }
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
  fs.writeFileSync(path.resolve(topPath, '../apply.json'), beautifulCode(funApplyFunList))
  writeWord(funApplyFunList, staticList,stateList, refList ,topPath)
  writeHtml(funApplyFunList, staticList)
}

main()

module.exports = {
  getFileString
}
