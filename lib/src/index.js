const {funApplyFunList, staticList, antd, React} = window

const { Button, Tree, Typography  } = antd
const { Paragraph } = Typography;
const { useEffect, useState } = React

function XinDoc() {

  const [treeData, setTreeData] = useState([]);
  const [funcBody, setFuncBody] = useState('')

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
      if(parent && parent[item]) {
        funcItem.children = getLeftList(parent[item].otherFuncList, parent[item].ownFuncList, parent)
      }
    })
    return result
  }

  const onSelect = (key, e) => {
    getFuncBody(funApplyFunList,e.node.title)
  }

  const getFuncBody = (list,title) => {
    let funcKeys = Object.keys(list);
    for(let i=0; i< funcKeys.length; i++) {
      if(funcKeys[i] === title) {
        let funcBody = list[funcKeys[i]].funcbody;
        const params = list[funcKeys[i]].params;
        if(!funcBody.includes('=>')) {
          funcBody = `(${params.toString()}) => ` + funcBody
        }
        setFuncBody(funcBody);
        return;
      }
      if(list[funcKeys[i]] && list[funcKeys[i]].otherFuncList) {
        getFuncBody(list[funcKeys[i]].otherFuncList,title)
      }
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
        marginLeft: '100px'
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
        children: funcBody
      })
    })]
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(XinDoc));