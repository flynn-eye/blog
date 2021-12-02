---

title: angular提升打包速度

meta:
  - name: description
    content: angular提升打包速度
  - name: keywords
    content: angular 

created: 2020/11/26

updated: 2020/11/26
 
tags:
  - angular

---
当维护的项目越来越大时，可能修改一下需要好长时间才会构建完成，十分的浪费时间，我在网上查了一下webpack优化构建速度的方案最简单有效的有两个，第一个是使用dllplugin，他可以将一些不常改动的文件打包之后就不打包了，直接用就可以了。第二个就是happypack，利用多线程提升构建速度。

### ng-build-plus

- 首先angular的webpack是不对外暴露的，ng 6之后 ng reject也废弃了，当然社区里提供了另一个方案。`ngx-build-plus`可以方便的配置webpack，可以去他的npm仓库看一下，文档介绍了这个包对应不同的ng版本 ，因为我ng版本是7，于是我`ngx-build-plus` 也下载了7.0.0。之后将`angular.json`里的配置文件修改一下

  ```
  "serve": {
            //替换原来的配置"builder": "@angular-devkit/build-angular:dev-server",
            "builder": "ngx-build-plus:dev-server",
            "options": {
              "browserTarget": "saas:build"
            },
  }
  ```

  之后在目录最外层创建一个`webpack.extra.js`。之后的配置就可以写在里面了。`ngx-build-plus`会将我们添加的webpack配置与内置的webpack配置merge。

- 之后再`package.json`里修改*script*

  ```
   "start": "ng serve ----extraWebpackConfig ./webpack.extra.js"
   
  ```

  

### 配置happypack

- `npm i -D Happypack`

- 之后在`webpack.extra.js`添加

  ```
  const webpack = require('webpack');
  const path = require('path');
  const HappyPack = require('happypack');
  module.exports = {
      module: {
          rules: [
              {
                  test: /\.ts$/,
                  //把对.js 的文件处理交给id为happyBabel 的HappyPack 的实例执行
                  loader: 'happypack/loader?id=happyBabel',
                }
          ]
      },
      plugins: [
          new HappyPack({
              //用id来标识 happypack处理那里类文件
            id: 'happyBabel',
            //如何处理  用法和loader 的配置一样
            use: [
              {
                path: 'ts-loader',
                query: {
                  happyPackMode: true,
                  //configFile: e.resolve(module, 'tsconfig.json')
                }
  
              }
            ],
            //线程数推荐为4
            threads:4
          })
      ]
  }
  
  ```

- happypack的配置比较简单，这样就结束了

### 配置dllplugin

- 社区里很多简单的第三方配置方法，ng也有一个`webpack-dll-ng-module-loader/plugin`

  下载之后直接

  ```
  const {
      CheatAngularCompilerResourcePlugin 
    } = require("webpack-dll-ng-module-loader/plugin");
  plugins: [  new CheatAngularCompilerResourcePlugin()]
  ```

### 使用webpack-bundle-analyzer 查看打包情况

- `npm i -D webpack-bundle-analyzer `

  ```
  let BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
   plugins: [
  //性能分析
          // new BundleAnalyzerPlugin({
          //     //  可以是`server`，`static`或`disabled`。
          //     //  在`server`模式下，分析器将启动HTTP服务器来显示软件包报告。
          //     //  在“静态”模式下，会生成带有报告的单个HTML文件。
          //     //  在`disabled`模式下，你可以使用这个插件来将`generateStatsFile`设置为`true`来生成Webpack Stats JSON文件。
          //     analyzerMode: 'server',
          //     //  将在“服务器”模式下使用的主机启动HTTP服务器。
          //     analyzerHost: '127.0.0.1',
          //     //  将在“服务器”模式下使用的端口启动HTTP服务器。
          //     analyzerPort: 8888, 
          //     //  路径捆绑，将在`static`模式下生成的报告文件。
          //     //  相对于捆绑输出目录。
          //     reportFilename: 'report.html',
          //     //  模块大小默认显示在报告中。
          //     //  应该是`stat`，`parsed`或者`gzip`中的一个。
          //     //  有关更多信息，请参见“定义”一节。
          //     defaultSizes: 'parsed',
          //     //  在默认浏览器中自动打开报告
          //     openAnalyzer: true,
          //     //  如果为true，则Webpack Stats JSON文件将在bundle输出目录中生成
          //     generateStatsFile: false, 
          //     //  如果`generateStatsFile`为`true`，将会生成Webpack Stats JSON文件的名字。
          //     //  相对于捆绑输出目录。
          //     statsFilename: 'stats.json',
          //     //  stats.toJson（）方法的选项。
          //     //  例如，您可以使用`source：false`选项排除统计文件中模块的来源。
          //     //  在这里查看更多选项：https：  //github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
          //     statsOptions: null,
          //     logLevel: 'info' // 日志级别。可以是'信息'，'警告'，'错误'或'沉默'。
          //   }),
  ]
  ```

- 之后直接运行他还会打开一个8888端口的网页图形化显示打包状况，这里我就不贴图了
### 当然在我搜索如何提升打包效率的时候知乎大佬直接推荐最近很火的snowpack以及vue3.0将推出的vite。