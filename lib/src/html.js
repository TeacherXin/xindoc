module.exports = (context,funApplyFunList,staticList) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <script crossorigin src="/assets/react.min.js"></script>
      <script crossorigin src="/assets/react-dom.min.js"></script>
      <script src="/assets/dayjs.min.js"></script>
      <script src="/assets/antd.min.js"></script>
      <script>window.funApplyFunList=${JSON.stringify(funApplyFunList)};window.staticList=${JSON.stringify(staticList)}</script>
    </head>
    <body>
      <div id="root">${context}</div>
      <script src="${context}"></script>
    </body>
    </html>
  `
}