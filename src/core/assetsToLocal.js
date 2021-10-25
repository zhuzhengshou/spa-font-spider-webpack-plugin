const chalk = require('chalk')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const { devTmpPath } = require('../config')
module.exports = ({assets, pluginOptions}) => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(devTmpPath)) {
        fsExtra.emptyDirSync(devTmpPath)
      } else {
        fsExtra.ensureDirSync(devTmpPath)
      }
      Object.keys(assets).forEach(filePath => {
        // 只将非soucemap文件持久化
        if (!(filePath.split('.').reverse()[0] === 'map')) {
          const absoulteUri = path.join(devTmpPath, filePath)
          fsExtra.ensureFileSync(absoulteUri)
          fs.writeFileSync(absoulteUri, assets[filePath].source())
        }
      })
      resolve(pluginOptions)
    } catch(e) {
      console.log(chalk.red(`\n项目中经webpack生成的assets本地持久化处理时失败\n`))
      reject(e)
    }
  })
}