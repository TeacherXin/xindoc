import {showString} from './string'

/**
 * 
 * @param {*number} num :操作数
 * @returns 操作数*操作数
 * @level 5
 */
function util1(num) {
  util2(num, num);
  utilObject.util3();
  return num*num
}

/**
 * 
 * @param {*number} num1 :操作数1
 * @param {*number} num2 :操作数2
 * @returns 操作数1 * 操作数2
 * @level 5
 */
function util2(num1, num2) {
  return num1*num2
}

const utilObject = {
  /**
   * @level 5
   */
  async util3() {
    this.util4()
    this.util5()
  },
  /**
   * @level 5
   */
  util4: (a,b,c) => {
    this.util5()
  },
  /**
   * @level 5
   */
  util5: function() {
    showString([1,2,3])
  }
}

/**
 * 递归 + 闭包
 * @returns 
 * @level 5
 */
function closePkCall() {
  return () => {
    console.log(123);
    closePkCall()
  }
}

/**
 * 闭包
 * @returns 
 * @level 5
 */
function closePkExpress() {
  return function() {
    console.log(123);
  }
}


export default {
  util1,
  util2,
  ...utilObject
}