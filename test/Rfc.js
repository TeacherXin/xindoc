import React, { useEffect, useRef, useState } from 'react'

export default function RFC(props) {

  // 用来计数的状态
  const [num, setNum] = useState(0)
  // 通过useRef定义的num
  const [refNum, setRefNum] = useRef(null)

  /**
   * 每次组件更新都会调用
   * @level 4
   */
  useEffect(() => {
    getNumList()
  })

  /**
   * 组件第一次更新会调用
   * @level 3
   */
  useEffect(() => {

  },[])

  /**
   * num更新的时候调用
   * @level 3
   */
  useEffect(() => {

  },[num])

  /**
   * 父组件的state更新时调用
   * @level 4
   */
  useEffect(() => {

  },[props.state])

  /**
   * 点击事件
   * @level 3
   */
  const click = () => {
    console.log(123);
  }

  /**
   * 返回数字列表
   * @returns {arr} 数字列表
   * @level 3
   */
  const getNumList = () => {
    setNum(22)
    return [1, 2, 3]
  }
 

  return (
    <div>RFC</div>
  )
}
