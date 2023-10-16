const path = require('path')

const xindocConfig = require(path.resolve('./xindoc.config.js'))
const publiclist = xindocConfig.publiclist


const noApplyFuncList = [
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

module.exports = {
  noApplyFuncList,
  publiclist
}
