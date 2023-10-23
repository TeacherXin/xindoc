const {funApplyFunList, staticList, antd, React} = window

const { Button, Tree, Typography, Input  } = antd
const { Paragraph } = Typography;
const { useEffect, useState } = React

function XinDoc() {

  const [treeData, setTreeData] = useState([]);
  const [funcBody, setFuncBody] = useState('');
  const [path, setPath] = useState('')
  const [params, setParams] = useState([]);
  const [inputParams, setInputParams] = useState({})
  const [result, setResult] = useState('')

  useEffect(() => {
    staticList.forEach(element => {
      delete funApplyFunList[element]
    });
    const list = getLeftList(funApplyFunList,[],null);
    console.log(list);
    setTreeData(list)
  },[])

  const getLeftList = (list, ownList,parent) => {
    const result = []
    const keyList = Object.keys(list)
    for(let i=0; i< keyList.length;i ++) {
      if(list[keyList[i]].level < 3 || list[keyList[i]].bHidden) {
        continue;
      }
      const funcItem = {
        title: keyList[i],
        key: keyList[i] + i + Math.random()
      }
      result.push(funcItem)
      setFuncToWindow(funApplyFunList,keyList[i])
      const childList = {...list[keyList[i]].otherFuncList};
      if(Object.keys(childList).length > 0 || list[keyList[i]].ownFuncList.length > 0) {
        funcItem.children = getLeftList(childList,list[keyList[i]].ownFuncList,list)
      }
    }
    ownList.forEach((item,index) => {
      const funcItem = {
        title: item,
        key: item + index + Math.random()
      }
      result.push(funcItem)
      setFuncToWindow(funApplyFunList,item)
      if(parent && parent[item]) {
        if(item === funcItem.title && parent[item].ownFuncList.includes(funcItem.title)) {
          console.log('递归');
        }else{
          funcItem.children = getLeftList(parent[item].otherFuncList, parent[item].ownFuncList, parent)
        }
      }
    })
    return result
  }

  const onSelect = (key, e) => {
    getFuncBody(funApplyFunList,e.node.title);
    setInputParams({})
    setResult('')
  }

  const setFuncToWindow = (list,funcName) => {
    let funcKeys = Object.keys(list);
    for(let i=0; i< funcKeys.length; i++) {
      if(funcKeys[i] === funcName) {
        let funcBody = list[funcKeys[i]].funcbody;
        let fun = eval(funcBody);
        window[funcName] = fun;
      }
      if(list[funcKeys[i]] && list[funcKeys[i]].otherFuncList) {
        setFuncToWindow(list[funcKeys[i]].otherFuncList,funcName)
      }
    }
  }

  const getResult = () => {
    let fun = eval(funcBody)
    let params = Object.values(inputParams).map(item => {
      return (new Function(`return ${item}`))()
    })
    let result = fun(...params);
    setResult(result);
    setInputParams({})
  }

  const getFuncBody = (list,title) => {
    let funcKeys = Object.keys(list);
    for(let i=0; i< funcKeys.length; i++) {
      if(funcKeys[i] === title) {
        let funcBody = list[funcKeys[i]].funcbody;
        const params = list[funcKeys[i]].params;
        const path = list[funcKeys[i]].path;
        setParams(params)
        setPath(path)
        if(!funcBody.includes('=>')) {
          funcBody = `(${params.toString()}) => ` + funcBody
        }
        setFuncBody(funcBody);
        return funcBody;
      }
      if(list[funcKeys[i]] && list[funcKeys[i]].otherFuncList) {
        getFuncBody(list[funcKeys[i]].otherFuncList,title)
      }
    }
  }

  const onChange = (paramName) => {
    return (e) => {
      inputParams[paramName] = e.target.value;
      setInputParams({...inputParams})
    }
  }
  
  return React.createElement("div", {
    style: {
      display: 'flex'
    },
    children: [React.createElement(Tree, {
      defaultExpandedKeys: ['0-0-0', '0-0-1'],
      defaultSelectedKeys: ['0-0-0', '0-0-1'],
      defaultCheckedKeys: ['0-0-0', '0-0-1'],
      onSelect: onSelect,
      treeData: treeData,
      style: {
        marginTop: '30px',
        marginLeft: '60px'
      }
    }), React.createElement(Paragraph, {
      style: {
        // marginTop: '20px'
      },
      children: React.createElement("pre", {
        style: {
          border: 'none',
          height: '570px',
          width: '650px',
          overflow: 'auto',
          marginLeft:'200px'
        },
        children: `**${path}** \n\n` + funcBody
      })
    }), React.createElement("div", {
      style: {
        marginTop:'20px',
        marginLeft: '20px'
      },
      children: [params.map(item => {
        return React.createElement(Input, {
          placeholder: item,
          style: {
            width: '200px',
            marginTop:'20px'
          },
          value: inputParams[item] || '',
          onChange: onChange(item)
        });
      }), React.createElement(Button, {
        onClick: getResult,
        style: {
          width:'200px',
          marginTop:'20px'
        },
        children: "\u63D0\u4EA4"
      }), React.createElement('p',{children: result})]
    })]
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(XinDoc));