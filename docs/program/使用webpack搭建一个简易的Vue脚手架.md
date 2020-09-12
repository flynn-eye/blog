---

title: 使用webpack搭建一个简易的Vue脚手架

meta:
  - name: description
    content: 使用webpack搭建一个简易的Vue脚手架
  - name: keywords
    content: webpack ,Vue ,脚手架

created: 2020/05/02

updated: 2020/05/02
 
tags:
  - webpack
  - Vue
  - 脚手架

---

## 前言

### 项目环境

- 前端框架：Bootstrap + jQuery

### 什么是前后端分离？

#### 首先创建一个文件夹

```
mkdir myvuecli
cd myvuecli
npm init
```

#### 创建的文件夹和文件如下

![目录.PNG](https://upload-images.jianshu.io/upload_images/7086885-e0c7be4af0ca1e48.PNG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 安装webpack

```
 npm install -D webpack webpack-cli
```

#### 创建webpack.config.js

```
const path = require('path')
module.exports ={
    entry:'./src/index.js',
    output:{
        path:path.resolve(__dirname,'dist'),
        filename:"index.js"
    }
}
```

#### 引入Vue

```
npm install vue --save
```

#### 引入babel

```
npm i --save-dev babel-loader
npm i  --save-dev @babel/core
```

babel可以配合许多的polyfill等支持许多新的es语法

在webpack.config.js中加入

```
 module:{
        rules:[
            {
                test: /\.js$/,
                loader:"babel-loader",
                exclude: /node_modules/
            }
        ]
    }
```

```
 resolve: {
    alias: {
       'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
 }
```

这是因为正在使用的是vue的运行时版本，而此版本中的编译器时不可用的，我们需要把它切换成运行时 + 编译的版本，所以添加如上代码。

#### 图片样式资源的加载

```
npm install --save-dev css-loader style-loader
npm install --save-dev file-loader url-loader
```

在rules里添加规则

```
{
     test: /\.css$/,
     loader: 'style-loader!css-loader'
}，
{
     test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
     loader: 'url-loader',
     options: {
         limit: 1000
         }
},
```



在index.html中添加

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>vue demo</title>
</head>
<body>
    <div id="app">
        <img :src="logo" alt="logo" class="logo">
        {{msg}}
    </div>
    <script src="./dist/index.js"></script>
</body>
</html>
```

src下index.js

```
import Vue from 'vue'
import './styles/main.css'
import logo from'./images/logo.png'
var vm = new Vue({
    el:'#app',
    data:{
        logo:logo,
        msg:'hello vue'
    }
})
```

运行`npx webpack`可以发现如图下显示，但是和我们平时开发的cli还是有很大不同的
![捕获1.PNG](https://upload-images.jianshu.io/upload_images/7086885-6cb094d8bc20a762.PNG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


#### 引入html-webpack-plugin

```
npm install --save-dev html-webpack-plugin
```

webpack.config.js中配置plugin

```
const HtmlWebpackPlugin = require('html-webpack-plugin')

plugins:[
     new HtmlWebpackPlugin({
       	title: 'title',
        template: 'index.html'         
     })
]

```

#### 安装devserver开启服务器

```
npm install --save-dev webpack-dev-server
```

webpack.config.js中配置

```
module.exports = {
	 devServer:{
        contentBase:"./dist"
     },
}
```

在package.json中配置

```
 "scripts": {
    "dev":"webpack-dev-server --open",
  },

```

#### 处理.vue文件

之前提到的在cli中我们使用的是.vue文件，那怎么利用.vue文件开发呢

```
npm install --save-dev vue-loader vue-template-compiler
```

webpack.config.js添加loader

```
{
    test: /\.vue$/,
    loader: 'vue-loader'
 }
```

index.js改为

```
import Vue from 'vue'
import App from './app.vue'

new Vue({
    el: '#app',
    template: '<App/>',
    components: { App }
})
```

创建app.vue

```
<template>
    <div class='red'>
        <img :src='logo'/>
        {{msg}}
    </div>
</template>
<script>
import logo from '../asserts/logo.png'
    export default {
        name:'app',
        data(){
            return {
                msg: 'hello vu21e 321!1!',
                logo:logo
            }
        }
    }
</script>
<style>
.red{
    color:blue;
    font-size:20px;
}
</style>
```
index.html更改为
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="app">
    </div>
</body>
</html>
```
#### 热部署

```
const webpack = require('webpack');
......
    plugins:[
       new webpack.HotModuleReplacementPlugin(),
    ],
```
现在就可以自动刷新了
