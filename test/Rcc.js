import React, { Component } from 'react'
import util1 from './util'

export default class Rcc extends Component {

  state = {
    //姓
    firstName: '',
    //名
    lastName: ''
  }

  //父亲的名字
  parentName = 'lixiaolong'

  /**
   * @level 5
   */
  componentDidMount() {
    yyds.getNodeWithPropName()
  }

  /**
   * 返回两数之和(*类型， 变量名: 描述)
   * @param {*number} num1 :加数
   * @param {*number} num2 :被加数
   * @returns 总和
   * @level 3
   */
  func1 = (num1, num2) => {
    return num1 + num2
  }

  /**
   * 输出两数之和(*类型， 变量名: 描述)
   * @param {*number} num1 :加数
   * @param {*number} num2 :被加数
   * @level 3
   */
  func2 = (num1, num2) => {
    console.log(this.func1(num1, num2));
    util1();
  }

  render() {
    return (
      <div>Rcc</div>
    )
  }
}
