import React, { useEffect, useState } from 'react'

export default function RFC(props) {

  // 用来计数的状态
  const [num, setNum] = useState(0)

  /**
   * 每次组件更新都会调用
   * @level 4
   */
  useEffect(() => {

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


  return (
    <div>RFC</div>
  )
}
