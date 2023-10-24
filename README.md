# xindoc

## 安装和使用

### 方式1：

安装
```
npm install hxindoc
```

在编辑器中，复制某个文件的路径，在项目中执行
```
npx hxindoc path=<文件路径>
```
或者
```
npx hxindoc <文件路径>
```

### 方式2：
下载git地址：
```
https://github.com/TeacherXin/xindoc.git
```
下载好项目后，进入到项目所在的路径，在终端输入：
```
npm run test path=<文件路径>
```
或者
```
npm run test <文件路径>
```
### 输出结果
上面的方式，会在文件所在同级目录创建出两个文件

**apply.md**： Markdown文档

**apply.json**:  方法中的函数栈，通过JSON来进行表示




## 文档的生成规范

### 普通参数说明
给方法书写注释时，可以在函数上方以 /** 的方式，生成下面的模板
```
/**
 * 
 * @param {*} num1 
 * @param {*} num2 
 * @returns
 */
func2 = (num1, num2) => {
  console.log(this.func1(num1, num2));
  return true
}
```
* 在第一行中，需要书写该方法的简单描述。
* 而 * 的位置，是用来书写该参数的变量类型。
* 变量后的位置（这里要有一个空格，默认模板会带，不要删掉），是用来书写参数的说明。
* returns后面，用来书写返回值的类型和说明（由于默认模板并没有把类型带出来，所以如果有需要，自己补出来）

这里工具有一个规范，就是在模板之外，我们要额外添加一个@level ，用来表示该方法的级别。如果level > 2，工具才会对方法进行识别。

例如上面的代码，加过注释之后，就会变成：
```
/**
 * 输出两数之和(*类型， 变量名: 描述)
 * @param {number} num1 加数
 * @param {number} num2 被加数
 * @returns {boolean} true | false
 * @level 3
 */
func2 = (num1, num2) => {
  console.log(this.func1(num1, num2));
}
```

### 复杂的参数类型
```
/**
 * 返回人类的相关信息
 * @param {Object} people 人类
 * @param {string} people.name 姓名
 * @param {string} people.age 年龄
 * @returns {string} 信息
 * @level 5
 */
getPeopleMessage(people) {
  if(!people.name) {
    throw new Error('错误的姓名')
  }
  const {name, age} = people;
  return name + age
}
```
复杂的参数类型，可以通过people.name的方式，对其内部的变量进行补充说明。

### 给方法增加作者和邮箱

```
/**
 * 返回人类的相关信息
 * @author xuhxin <xuhxin@yonyou.com>
 */
getPeopleMessage(people) {
  if(!people.name) {
    throw new Error('错误的姓名')
  }
  const {name, age} = people;
  return name + age
}
```
可以通过添加author的方式，添加方法的编写人以及对应的邮箱信息。

### 增加方法用例
```
/**
 * 返回人类的相关信息
 * @example getPeopleMessage('xuhxin','24')
 */
getPeopleMessage(people) {
  if(!people.name) {
    throw new Error('错误的姓名')
  }
  const {name, age} = people;
  return name + age
}
```
通过添加example的方式，书写方法调用实例。
