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
   * 返回两个树的和
   * @param {*} num1 
   * @param {*} num2 
   * @level 4
   * @returns 
   */
  func1 = (num1, num2) => {
    this.setState({
      firstName: num1,
      lastName: num2
    })
    return num1 + num2
  }

  /**
   * 输出两数之和(*类型， 变量名: 描述)
   * @param {number} num1 加数
   * @param {number} num2 被加数
   * @returns {boolean} true | false
   * @level 3
   */
  func2 = (num1, num2) => {
    console.log(this.func1(num1, num2));
    return true
  }

  /**
   * 返回人类的相关信息
   * @author xuhxin <xuhxin@yonyou.com>
   * @param {Object} people 人类
   * @param {string} people.name 姓名
   * @param {string} people.age 年龄
   * @returns {string} 信息
   * @level 5
   * @example
   * getPeopleMessage('xuhxin','24')
   * @throws {Error} 错误的姓名
   */
  getPeopleMessage(people) {
    if(!people.name) {
      throw new Error('错误的姓名')
    }
    const {name, age} = people;
    return name + age
  }

  /**
   * 空方法
   * @level 3
   */
  logFunc() {
    console.log(123);
  }

  render() {
    return (
      <div>Rcc</div>
    )
  }
}
