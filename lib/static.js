const noApplyFuncList = [
  'setState', 
  'templateByUuid',
  'ref',
  'stopPropagation',
  'add',
  'log',
  'get',
  'post',
  ...Object.getOwnPropertyNames(Array.prototype),
  ...Object.getOwnPropertyNames(Object.prototype),
  ...Object.getOwnPropertyNames(Array),
  ...Object.getOwnPropertyNames(Object)
];

const yydsFunc = [
  'getCurrNode',
  'getNodeWithPropName',
  'getGlobalData',
  'generateNid',
  'geneateCode',
  'cloneDeep',
  'getNodeByNid',
  'replaceNode',
  'execute',
  'setTreeMapCache',
  'updateCurrNode', 
  'loopTreeData'
]

module.exports = {
  noApplyFuncList,
  yydsFunc
}