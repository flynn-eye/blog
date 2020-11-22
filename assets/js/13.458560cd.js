(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{609:function(e,t,o){"use strict";o.r(t);var a=o(14),i=Object(a.a)({},(function(){var e=this,t=e.$createElement,o=e._self._c||t;return o("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[o("h3",{attrs:{id:"在-chrome-devtools-中调试-javascript"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#在-chrome-devtools-中调试-javascript"}},[e._v("#")]),e._v(" 在 Chrome DevTools 中调试 JavaScript")]),e._v(" "),o("p",[o("a",{attrs:{href:"https://developers.google.cn/web/tools/chrome-devtools/javascript",target:"_blank",rel:"noopener noreferrer"}},[e._v("官方文档"),o("OutboundLink")],1)]),e._v(" "),o("p",[o("a",{attrs:{href:"https://googlechrome.github.io/devtools-samples/debug-js/get-started",target:"_blank",rel:"noopener noreferrer"}},[e._v("debug文件"),o("OutboundLink")],1)]),e._v(" "),o("p",[e._v("输入数据发现出现了bug\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-0b359d3d5b7f3af4.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"发现bug"}})]),e._v(" "),o("p",[o("code",[e._v("F12")]),e._v("打开开发者工具，点击"),o("code",[e._v("sources")]),e._v("里的"),o("code",[e._v("get-started.js")]),e._v(" "),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-778b5b19c14ac18c.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"按钮的功能"}})]),e._v(" "),o("ul",[o("li",[o("p",[e._v("方法一：点击Event Listener Breakpoints里的mouse下的click事件这个时候点击页面的button按钮时就可以在点击后打上断点，向下执行，发现执行到"),o("code",[e._v("updateLabel()")]),e._v("处点击进入函数就跳转到函数内执行，每条语句都会把执行过后的值标出来，同时"),o("code",[e._v("scope")]),e._v("菜单栏下也有全局的变量，相比于console.log确实方便不少\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-f3ebf4fdded4b1cc.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"3.JPG"}})])]),e._v(" "),o("li",[o("p",[e._v("方法二：点击watch栏里点击"),o("code",[e._v("+")]),e._v("输入两条数据 "),o("code",[e._v("typeof sum")]),e._v(" 和"),o("code",[e._v("sum")]),e._v("可以像之前一样重新debug，可以发现从点击事件触发后，watch栏内的值从undefined到有值，可以发现预期希望时number类型的值居然是String类型。\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-c13dbe2834c2eaa5.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"4.JPG"}})])])]),e._v(" "),o("h5",{attrs:{id:"各种debug打断点的方式"}},[o("a",{staticClass:"header-anchor",attrs:{href:"#各种debug打断点的方式"}},[e._v("#")]),e._v(" 各种debug打断点的方式")]),e._v(" "),o("ul",[o("li",[e._v("代码行打断点\n"),o("ul",[o("li",[e._v("代码断点：点击代码右侧行数就可以打断点，可以在断点前后添加一些console.log\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-6a79c1b6338656eb.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"5.JPG"}})])])])]),e._v(" "),o("p",[e._v("代码来帮助debug")]),e._v(" "),o("ul",[o("li",[o("p",[e._v("条件断点：如果知道需要调查的确切代码区域，但只想在其他一些条件成立时进行暂停，则可使用条件代码行断点。选择代码行数处鼠标右击可以发现并选择 "),o("strong",[e._v("Add conditional breakpoint")]),e._v("。\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-8ce027fd4d2c1fbd.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"6.JPG"}})])]),e._v(" "),o("li",[o("p",[e._v("DOM处添加断点，选择自己想要添加断点的element右键。")]),e._v(" "),o("ul",[o("li",[o("strong",[e._v("Subtree modifications")]),e._v("： 在移除或添加当前所选节点的子级，或更改子级内容时触发这类断点。 在子级节点属性发生变化或对当前所选节点进行任何更改时不会触发这类断点。")]),e._v(" "),o("li",[o("strong",[e._v("Attributes modifications")]),e._v("：在当前所选节点上添加或移除属性，或属性值发生变化时触发这类断点。")]),e._v(" "),o("li",[o("strong",[e._v("Node Removal")]),e._v("：在移除当前选定的节点时会触发。\n"),o("img",{attrs:{src:"https://upload-images.jianshu.io/upload_images/7086885-716576a39a66f53b.JPG?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240",alt:"7.JPG"}})])])]),e._v(" "),o("li",[o("p",[e._v("XHR/Fetch 断点：-")]),e._v(" "),o("ul",[o("li",[e._v("点击 "),o("strong",[e._v("Sources")]),e._v(" 标签。")]),e._v(" "),o("li",[e._v("展开 "),o("strong",[e._v("XHR Breakpoints")]),e._v(" 窗格。")]),e._v(" "),o("li",[e._v("点击 "),o("strong",[e._v("Add breakpoint")]),e._v("。")]),e._v(" "),o("li",[e._v("输入要对其设置断点的字符串。 DevTools 会在 XHR 的请求网址的任意位置显示此字符串时暂停。")]),e._v(" "),o("li",[e._v("按 Enter 键以确认。")])])]),e._v(" "),o("li",[o("p",[e._v("事件监听断点：")]),e._v(" "),o("ul",[o("li",[e._v("点击 "),o("strong",[e._v("Sources")]),e._v(" 标签。")]),e._v(" "),o("li",[e._v("展开 "),o("strong",[e._v("Event Listener Breakpoints")]),e._v(" 窗格。 DevTools 会显示 "),o("strong",[e._v("Animation")]),e._v(" 等事件类别列表。")]),e._v(" "),o("li",[e._v("勾选这些类别之一以在触发该类别的任何事件时暂停，或者展开类别并勾选特定事件。")])])])])])}),[],!1,null,null,null);t.default=i.exports}}]);