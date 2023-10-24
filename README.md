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

**localhost:2746**:  表示方法调用链路的页面
