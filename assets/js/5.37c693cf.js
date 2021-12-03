(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{596:function(e,t,a){e.exports=a.p+"assets/img/16cc8f7acd96cd8c.199ac6bb.jpg"},622:function(e,t,a){"use strict";a.r(t);var s=a(14),c=Object(s.a)({},(function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[s("h2",{attrs:{id:"前言"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#前言"}},[e._v("#")]),e._v(" 前言")]),e._v(" "),s("p",[e._v("面试的时候js的事件循环经常会被问到，之前我也了解过浏览器的事件循环，但是显然作为回答还是不够完美，现在写一下node的事件循环，发现node的事件循环还是相对于浏览器有点复杂的,可以找一些关于异步io模型的文章阅读。")]),e._v(" "),s("h2",{attrs:{id:"node的执行环境"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#node的执行环境"}},[e._v("#")]),e._v(" node的执行环境")]),e._v(" "),s("p",[s("code",[e._v("经常有人问node是单线程的吗?")]),e._v(" "),s("em",[e._v("答：js执行的主线程是单线程，但是一些异步的任务如io，网络请求交给libuv等库执行可多线程，线程池默认大小为4，可用process.env.UV_THREADPOOL_SIZE更改")])]),e._v(" "),s("img",{attrs:{width:"500px",src:a(596)}}),e._v(" "),s("h2",{attrs:{id:"node-eventloop阶段"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#node-eventloop阶段"}},[e._v("#")]),e._v(" node eventLoop阶段")]),e._v(" "),s("ul",[s("li",[e._v("timers：执行setTimeout() 和 setInterval()中到期的callback。")]),e._v(" "),s("li",[e._v("pending callbacks：上一轮循环中一些和底层系统有关的操作callback会被延迟到这一轮的这一阶段执行")]),e._v(" "),s("li",[e._v("idle, prepare：仅内部使用，存放了process.nextTick队列")]),e._v(" "),s("li",[e._v("poll：最为重要的阶段，执行I/O callback，在适当的条件下会阻塞在这个阶段")]),e._v(" "),s("li",[e._v("check：执行setImmediate的callback")]),e._v(" "),s("li",[e._v('close callbacks：执行close事件的callback，例如socket.on("close",func)')])]),e._v(" "),s("p",[s("em",[e._v("这些阶段执行完为一tick")])]),e._v(" "),s("h2",{attrs:{id:"重点"}},[s("a",{staticClass:"header-anchor",attrs:{href:"#重点"}},[e._v("#")]),e._v(" 重点")]),e._v(" "),s("p",[e._v("setTimeout(callback,0)\n会被转换成setTimeout(callback,1)。并且定时器的执行并不会完全准确，当他的delay时间到了，调度系统只能尽可能快的去执行他")])])}),[],!1,null,null,null);t.default=c.exports}}]);