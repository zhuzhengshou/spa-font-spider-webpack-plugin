# spa-font-spider-webpack-plugin

一个基于font-spider的，适用于**SPA**项目中动态渲染出的web字体提取、压缩的webpack插件

优势：
  * 使用于SPA项目
  * 解决了FOIT (Flash Of Invisible Text)和FOUT (Flash Of Unstyled Text)的问题
  * 解决项目中的动态中文字符(接口返回)
  * 集成于webpack打包流程中，不需打包后额外操作

## 安装

``` shell
npm install spa-font-spider-webpack-plugin
```

## 使用

### 步骤一: 将项目中需要用到的字体包文件托管在web服务器(开发阶段可以使用express搭建本地web服务器)
不可以使用本地的
```
需要的两个字体包：
思源黑体-regular (http://192.168.0.97:3001/public/si-yuan-regular.ttf)、
思源黑体-bold (http://192.168.0.97:3001/public/si-yuan-bold.ttf)
```


### 步骤二: 为每个字体包自定义一个你需要的系列名(不需代码中定义)，并在CSS 代码中使用

``` css
p {
  font-family: 'si-yuan-regular';
}
h5 {
  font-family: 'si-yuan-bold';
}
```

### 步骤三: 思考项目中哪些页面会被通过链接直接访问，选择性提供这些页面url 组成部分中的文件路径、查询字符串、片段标识符

```
'/'(多用于vue-router这类路由管理器指定了redirect情况下，插件默认包含这条)、'/?age=18'、'/#/home'
```

### 步骤四：进行webpack插件的配置(devServer本地开发和build打包时都可以配置)，并提供前面三步的参数

**注意事项：**
- 确保插件一定放在影响webpack assets资源的插件之后，举例：html-webpack-plugin、copy-webpack-plugin
- 插件要对于dev开发(dev-server运行项目)与build打包或者test测试要进行区别对待，默认根据process.env.NODE_ENV === 'development'来作为dev开发环境的判断
  如果项目对于process.env.NODE_ENV做了修改，那么需要通过插件传参(isDev)显示声明，详见下文-插件的配置项

以下的文件目录以vue-cli脚手架创建的项目举例:

``` javascript
const SPAFontSpiderWebpackPlugin = require("spa-font-spider-webpack-plugin")

vue-cli2.x包含及以下(build/webpack.dev.conf.js或 build/webpack.prod.conf.js)
plugins: [
    ......
    new HtmlWebpackPlugin(),
    new CopyWebpackPlugin(),
    new SPAFontSpiderWebpackPlugin({
      fontFamilyPkgList: [
        {
          url: 'http://192.168.0.54:3001/public/si-yuan-regular.ttf',
          name: 'si-yuan-regular'
        },
        {
          url: 'http://192.168.0.54:3001/public/si-yuan-bold.ttf',
          name: 'si-yuan-bold'
        }
      ]
    })
  ]

vue-cli2.x 以上(vue.config.js)
module.exports = {
  ......
 chainWebpack: config => {
  config
  .plugin('spa-font-spider')
  .use(SPAFontSpiderWebpackPlugin, [{
    fontFamilyPkgList: [
      {
        url: 'http://192.168.0.54:3001/public/si-yuan-regular.ttf',
        name: 'si-yuan-regular'
      },
      {
        url: 'http://192.168.0.54:3001/public/si-yuan-bold.ttf',
        name: 'si-yuan-bold'
      }
    ]
  }])
 }
```
## 插件的所有配置项
``` javascript
{
  /**
   * @type { Array<FontFamilyPkg>} 
   * @desc 项目内部使用的自定义字体包url和系列名称
   * interface FontFamilyPkg {
   *    url: string;
   *    name: string;
   * }
  */
  fontFamilyPkgList: [],
  /**
   * @type { Array<String>}
   * @desc 首页url 组成部分中的文件路径、查询字符串、片段标识符，默认['/'],显式传入的会与默认的合并
  */
  urlList: ['/'],
  /**
   * @type { Boolean }
   * @desc 是否对首屏所需的缩量字体包进行预加载。当你完全不希望出现字体闪烁时，请设为true，当你希望首屏加载速度相对快一些,请设为false
  */
  preload: false,
  /**
   * @type { Boolean }
   * @desc 是否需要全量包，当你认为首屏解析产生的所量字体包已经足够你所需的时候，请设置为false，避免多余的大文件网络请求带来的影响
  */
  complete: true,
  /**
   * @type { Boolean }
   * @desc 当前插件是否要运行在webpack-dev-server所搭建的服务中
  */
  isDev: process.env.NODE_ENV === 'development',
  /**
   * @type { Boolean }
   * @desc isDev为true的情况下，当随着开发修改源代码时，webpack-dev-server实时加载时，插件是否也要 为首页 实时生成新的字体包
  */
  hot: false,
  /**
   * @type { Boolean }
   * @desc 当插件运行失败时，是否不阻塞webpack的打包进程。当你希望插件的效果必须看到时，为false往往是有帮助的
  */
  silent: true
}
```

