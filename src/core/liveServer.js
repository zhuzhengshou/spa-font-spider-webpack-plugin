const express = require('express')
const portfinder = require('portfinder')
const { devTmpPath, pluginName } = require('../config')
const chalk = require('chalk')
const path = require('path')
const app = express()
let server
let serverHost
exports.getCanUseServerHost = (pluginOptions) => {
  return new Promise((resolve, reject) => {
    if (server && server.listening && serverHost) {
      resolve({serverHost, pluginOptions})
    } else {
      portfinder
      .getPortPromise()
      .then((port) => {
        app.use('*', function (req, res, next) {
          // 允许的请求主机名及端口号 也可以用通配符*， 表示允许所有主机请求，但是如果想允许ajax携带cookie请求，需要指定域名，不可用通配符
          res.header("Access-Control-Allow-Origin", '*')
          //表明服务器支持的请求类型
          res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT")
          //表示服务器支持的请求数据类型
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
          // 允许请求携带cookie 
          res.header("Access-Control-Allow-Credentials", true)
          next()
        })
        app.use(express.static(devTmpPath))
        server = app.listen(port, (err) => {
          if (err) {
            console.log(chalk.red(`\n${pluginName}插件所需的本地临时服务器启动失败`))
            reject(err)
          } else {
            serverHost = `http://localhost:${port}`
            resolve({serverHost, pluginOptions})
          }
        })
        server.on('close', () => {
          server = null
          serverHost = null
        })
      })
      .catch((err) => {
        console.log('没有为即将开启的本地服务器使用找到一个空闲端口')
        reject(err)
      })
    }
  })
}
exports.closeServer = () => {
  if (server) {
    server.close()
    serverHost = null
  }
}


