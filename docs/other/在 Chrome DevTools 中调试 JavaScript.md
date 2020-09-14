---

title: 在 Chrome DevTools 中调试 JavaScript

meta:
  - name: description
    content: 在 Chrome DevTools 中调试JavaScript
  - name: keywords
    content: chrome ,DevTools ,debug

created: 2020/02/29

updated: 2020/02/29
 
tags:
  - chrome
  - debug

---

### 在 Chrome DevTools 中调试 JavaScript 

[官方文档](https://developers.google.cn/web/tools/chrome-devtools/javascript)

[debug文件](https://googlechrome.github.io/devtools-samples/debug-js/get-started)

输入数据发现出现了bug 
![发现bug](https://upload-images.jianshu.io/upload_images/7086885-0b359d3d5b7f3af4.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


`F12`打开开发者工具，点击`sources`里的`get-started.js`
![按钮的功能](https://upload-images.jianshu.io/upload_images/7086885-778b5b19c14ac18c.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 方法一：点击Event Listener Breakpoints里的mouse下的click事件这个时候点击页面的button按钮时就可以在点击后打上断点，向下执行，发现执行到`updateLabel()`处点击进入函数就跳转到函数内执行，每条语句都会把执行过后的值标出来，同时`scope`菜单栏下也有全局的变量，相比于console.log确实方便不少
![3.JPG](https://upload-images.jianshu.io/upload_images/7086885-f3ebf4fdded4b1cc.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 方法二：点击watch栏里点击`+`输入两条数据 `typeof sum` 和`sum`可以像之前一样重新debug，可以发现从点击事件触发后，watch栏内的值从undefined到有值，可以发现预期希望时number类型的值居然是String类型。
![4.JPG](https://upload-images.jianshu.io/upload_images/7086885-c13dbe2834c2eaa5.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


##### 各种debug打断点的方式

- 代码行打断点
  - 代码断点：点击代码右侧行数就可以打断点，可以在断点前后添加一些console.log
![5.JPG](https://upload-images.jianshu.io/upload_images/7086885-6a79c1b6338656eb.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

代码来帮助debug
  - 条件断点：如果知道需要调查的确切代码区域，但只想在其他一些条件成立时进行暂停，则可使用条件代码行断点。选择代码行数处鼠标右击可以发现并选择 **Add conditional breakpoint**。
![6.JPG](https://upload-images.jianshu.io/upload_images/7086885-8ce027fd4d2c1fbd.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

  - DOM处添加断点，选择自己想要添加断点的element右键。
    - **Subtree modifications**： 在移除或添加当前所选节点的子级，或更改子级内容时触发这类断点。 在子级节点属性发生变化或对当前所选节点进行任何更改时不会触发这类断点。
    - **Attributes modifications**：在当前所选节点上添加或移除属性，或属性值发生变化时触发这类断点。
    - **Node Removal**：在移除当前选定的节点时会触发。
![7.JPG](https://upload-images.jianshu.io/upload_images/7086885-716576a39a66f53b.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- XHR/Fetch 断点：-
  - 点击 **Sources** 标签。
  - 展开 **XHR Breakpoints** 窗格。
  - 点击 **Add breakpoint**。
  - 输入要对其设置断点的字符串。 DevTools 会在 XHR 的请求网址的任意位置显示此字符串时暂停。
  - 按 Enter 键以确认。

- 事件监听断点：
  - 点击 **Sources** 标签。
  - 展开 **Event Listener Breakpoints** 窗格。 DevTools 会显示 **Animation** 等事件类别列表。
  - 勾选这些类别之一以在触发该类别的任何事件时暂停，或者展开类别并勾选特定事件。
