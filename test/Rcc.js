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
   * 
   * @param {*} num1 
   * @param {*} num2 
   * @returns 
   */
  func1 = (num1, num2) => {
    return num1 + num2
  }

  /**
   * 输出两数之和(*类型， 变量名: 描述)
   * @param {number} num1 加数
   * @param {number} num2 被加数
   * @level 3
   */
  func2 = (num1, num2) => {
    console.log(this.func1(num1, num2));
    util1();
  }

  /**
   * 返回人类的相关信息
   * @param {Object} people 人类
   * $people @param {string} name 姓名
   * $people @param {string} age 年龄
   * @returns 信息
   * @level 5
   */
  getPeopleMessage(people) {
    const {name, age} = people;
    return name + age
  }

  render() {
    return (
      <div>Rcc</div>
    )
  }
}
