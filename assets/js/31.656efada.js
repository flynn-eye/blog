(window.webpackJsonp=window.webpackJsonp||[]).push([[31],{639:function(t,s,a){"use strict";a.r(s);var n=a(14),e=Object(n.a)({},(function(){var t=this,s=t._self._c;return s("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[s("p",[s("em",[t._v("最近在深入学习webpack，发现tapable是一个很重要的东西，写一篇文章记录一下。")])]),t._v(" "),s("p",[s("em",[t._v("有node经验的都知道，node是一个事件驱动的js runtime,我们发现很多的模块都继承于Event的模块，基于发布订阅的这种模式，让程序非常的有条理。而webpack的打包机制大量采用了这种方式，其中compiler和compilation都继承与tapable，我不知道把这个单词翻译成啥，但是发现tap的有水龙头，放水的意思，这有种事件流的感觉。")])]),t._v(" "),s("h3",{attrs:{id:"钩子简介"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#钩子简介"}},[t._v("#")]),t._v(" 钩子简介")]),t._v(" "),s("ul",[s("li",[t._v("基础钩子")])]),t._v(" "),s("blockquote",[s("p",[t._v("分为同步钩子和异步钩子，异步钩子有两种，串行并行，串行指执行完上面的才会执行下一个，并行是指两个一起执行，比如")])]),t._v(" "),s("div",{staticClass:"language- line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-text"}},[s("code",[t._v("setTimeout(()=>{\n    console.log('aa')\n},1000)\nsetTimeout(()=>{\n    console.log('bb')\n},2000)\n串行会在打印aa2秒后在打印bb\n并行会在打印aa1s后打印bb\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br"),s("span",{staticClass:"line-number"},[t._v("5")]),s("br"),s("span",{staticClass:"line-number"},[t._v("6")]),s("br"),s("span",{staticClass:"line-number"},[t._v("7")]),s("br"),s("span",{staticClass:"line-number"},[t._v("8")]),s("br")])]),s("p",[s("code",[t._v("每个构造函数的参数是一个数组吗，传几个参数就放几个长度的数组")])]),t._v(" "),s("div",{staticClass:"language- line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-text"}},[s("code",[t._v("new SyncHook(['arg1','arg2']);在调用的时候可以传入两个参数\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br")])]),s("table",[s("thead",[s("tr",[s("th",[t._v("类")]),t._v(" "),s("th",[t._v("功能")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("SyncHook")]),t._v(" "),s("td",[t._v("同步钩子")])]),t._v(" "),s("tr",[s("td",[t._v("AsyncParallelHook")]),t._v(" "),s("td",[t._v("异步并行钩子")])]),t._v(" "),s("tr",[s("td",[t._v("AsyncSeriesHook")]),t._v(" "),s("td",[t._v("异步串行钩子")])])])]),t._v(" "),s("ul",[s("li",[t._v("修饰钩子")])]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("类")]),t._v(" "),s("th",[t._v("功能")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("bail")]),t._v(" "),s("td",[t._v("保险类型，当一个事件回调在运行时返回的值不为 undefined 时，停止后面事件回调的执行。")])]),t._v(" "),s("tr",[s("td",[t._v("waterfall")]),t._v(" "),s("td",[t._v("瀑布类型，如果当前执行的事件回调返回值不为 undefined，那么就把下一个事件回调的第一个参数替换成这个值。")])]),t._v(" "),s("tr",[s("td",[t._v("loop")]),t._v(" "),s("td",[t._v("循环类型，如果当前执行的事件回调的返回值不是 undefined，重新从第一个注册的事件回调处执行，直到当前执行的事件回调没有返回值。")])])])]),t._v(" "),s("ul",[s("li",[t._v("注册方法")])]),t._v(" "),s("p",[s("code",[t._v("第一个参数string,事件名称,第二个参数回调方法")])]),t._v(" "),s("div",{staticClass:"language- line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-text"}},[s("code",[t._v("**.tap({\n    name:'xx', //type: string\n    stage: 10 // type:number default 0 ，越大执行越晚\n})\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br")])]),s("table",[s("thead",[s("tr",[s("th",[t._v("方法")]),t._v(" "),s("th",[t._v("功能")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("tap")]),t._v(" "),s("td",[t._v("同步注册")])]),t._v(" "),s("tr",[s("td",[t._v("tapAsync")]),t._v(" "),s("td",[t._v("异步的注册")])]),t._v(" "),s("tr",[s("td",[t._v("tap")]),t._v(" "),s("td",[t._v("异步注册接收promise，第二个参数function是promise")])])])]),t._v(" "),s("ul",[s("li",[t._v("调用方法")])]),t._v(" "),s("p",[s("code",[t._v("第一个参数string，后面的参数为回调函数的参数")])]),t._v(" "),s("table",[s("thead",[s("tr",[s("th",[t._v("方法")]),t._v(" "),s("th",[t._v("功能")])])]),t._v(" "),s("tbody",[s("tr",[s("td",[t._v("call")]),t._v(" "),s("td",[t._v("同步注册")])]),t._v(" "),s("tr",[s("td",[t._v("callAsync")]),t._v(" "),s("td",[t._v("异步的注册")])]),t._v(" "),s("tr",[s("td",[t._v("callPromise")]),t._v(" "),s("td",[t._v("promise注册的用promise调用")])])])]),t._v(" "),s("ul",[s("li",[t._v("拦截器\n如果你用过"),s("code",[t._v("axios")]),t._v("那拦截器你一定不陌生，tapable也有拦截器")])]),t._v(" "),s("div",{staticClass:"language- line-numbers-mode"},[s("pre",{pre:!0,attrs:{class:"language-text"}},[s("code",[t._v("hook.intercept({\n  // 注册时执行\n  register(tap) {\n    console.log('register', tap);\n    return tap;\n  },\n  // 触发事件时执行\n  call(...args) {\n    console.log('call', args);\n  },\n// 在 call 拦截器之后执行& loop钩子每次循环都会执行\n  loop(...args) {\n    console.log('loop', args);\n  },\n  // 事件回调调用前执行\n  tap(tap) {\n    console.log('tap', tap);\n  },\n});\n\n")])]),t._v(" "),s("div",{staticClass:"line-numbers-wrapper"},[s("span",{staticClass:"line-number"},[t._v("1")]),s("br"),s("span",{staticClass:"line-number"},[t._v("2")]),s("br"),s("span",{staticClass:"line-number"},[t._v("3")]),s("br"),s("span",{staticClass:"line-number"},[t._v("4")]),s("br"),s("span",{staticClass:"line-number"},[t._v("5")]),s("br"),s("span",{staticClass:"line-number"},[t._v("6")]),s("br"),s("span",{staticClass:"line-number"},[t._v("7")]),s("br"),s("span",{staticClass:"line-number"},[t._v("8")]),s("br"),s("span",{staticClass:"line-number"},[t._v("9")]),s("br"),s("span",{staticClass:"line-number"},[t._v("10")]),s("br"),s("span",{staticClass:"line-number"},[t._v("11")]),s("br"),s("span",{staticClass:"line-number"},[t._v("12")]),s("br"),s("span",{staticClass:"line-number"},[t._v("13")]),s("br"),s("span",{staticClass:"line-number"},[t._v("14")]),s("br"),s("span",{staticClass:"line-number"},[t._v("15")]),s("br"),s("span",{staticClass:"line-number"},[t._v("16")]),s("br"),s("span",{staticClass:"line-number"},[t._v("17")]),s("br"),s("span",{staticClass:"line-number"},[t._v("18")]),s("br"),s("span",{staticClass:"line-number"},[t._v("19")]),s("br"),s("span",{staticClass:"line-number"},[t._v("20")]),s("br")])]),s("p",[s("a",{attrs:{href:"https://github.com/flynn-eye/learnWebpack/blob/master/tapable/index.js",target:"_blank",rel:"noopener noreferrer"}},[t._v("github代码"),s("OutboundLink")],1)])])}),[],!1,null,null,null);s.default=e.exports}}]);