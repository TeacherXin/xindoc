## 组件中的state状态管理
firstName: 姓
lastName: 名
## 组件中的static状态管理
parentName: 父亲的名字
## 组件中的function管理
### (4) func1
**方法注释**：返回两个树的和
|参数名|参数类型|描述|
|--|--|--|
|num1|number|加数
|num2|number|被加数
|返回值|number|总和
**内部方法**: 
 (1) setState
**公共方法**: 未调用
**外部方法**: 未调用
### (5) func2
**方法注释**：输出两数之和(类型，变量名:描述)
|参数名|参数类型|描述|
|--|--|--|
|num1|number|加数
|num2|number|被加数
|返回值|boolean|true|false
**内部方法**: 
 (1) func1
**公共方法**: 
 (1) getNodeWithPropName
**外部方法**: 未调用
### (6) getPeopleMessage
**方法注释**：返回人类的相关信息
|参数名|参数类型|描述|
|--|--|--|
|people|Object|人类
|people.name|string|姓名
|people.age|string|年龄
|返回值|string|信息
**姓名邮箱**： xuhxin <xuhxin@yonyou.com>
**方法用例**：
```
 getPeopleMessage('xuhxin','24')
```
**内部方法**: 未调用
**公共方法**: 未调用
**外部方法**: 
 (1) util1 **<C:\Myself\xinDoc\test\util.js>**
### (7) fibonacci
**方法注释**：菲波那切数列的实现
|参数名|参数类型|描述|
|--|--|--|
|n|*number|数字
|返回值| 返回数字|返回数字
**方法特性**: 递归方法
**内部方法**: 
 (1) fibonacci
**公共方法**: 未调用
**外部方法**: 未调用
