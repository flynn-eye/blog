(window.webpackJsonp=window.webpackJsonp||[]).push([[28],{628:function(s,n,e){"use strict";e.r(n);var a=e(14),t=Object(a.a)({},(function(){var s=this,n=s.$createElement,e=s._self._c||n;return e("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[e("hr"),s._v(" "),e("h1",{attrs:{id:"typescript中的工具方法"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#typescript中的工具方法"}},[s._v("#")]),s._v(" Typescript中的工具方法")]),s._v(" "),e("h2",{attrs:{id:"前言"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#前言"}},[s._v("#")]),s._v(" 前言")]),s._v(" "),e("p",[s._v("最近好久不写博客了，一直忙着深入学习React,并带入工程实践当中。在工作中使用Angular，还是业余使用React，我都会用"),e("code",[s._v("Typescript")]),s._v("但是国内的大部分文章还停留在，一些简单的OOP上，或者强调Typescript的一些配置上，最近发现ts还有一些工具方法，我居然知道的不全，话说Typescript的文档感觉比react的还乱。希望自己敲一遍能有一个总结")]),s._v(" "),e("ul",[e("li",[e("p",[s._v("Partial")]),s._v(" "),e("p",[s._v("将其变为可选")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("interface People {\n  name: string\n}\n\nPartial<People>\n-----\n效果\n/*{\n* name?: string\n}*/\n\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br"),e("span",{staticClass:"line-number"},[s._v("11")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("Required")]),s._v(" "),e("p",[s._v("与Partial相反，变为不可选")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("我就不写代码了哈\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("Pick<T,K>")]),s._v(" "),e("p",[s._v("从T中取出K的属性")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("type Pick<T, K extends keyof T> = {\n  [P in K]: T[P];\n};\ntype NewPerson = Pick<People, 'name'>; //效果 { name: string; }\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("Exclude<T,K>")]),s._v(" "),e("p",[s._v("从T中移除K的属性")])]),s._v(" "),e("li",[e("p",[s._v("Extract<T,K>")]),s._v(" "),e("p",[s._v("返回T,K的交集")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("interface T{\n  name:string\n  age:number\n}\ninterface K{\n  age:number\n}\n效果是  {\n  age:number\n}\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("NonNullable"),e("T")],1),s._v(" "),e("p",[s._v("和Exclude效果差不多相当于帮你定义了第二个参数，把null|undefined移除")])]),s._v(" "),e("li",[e("p",[s._v("Omit<T,K>")]),s._v(" "),e("p",[s._v("像Pick和Exclude的结合\n把返回T中有，K中没有的")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("interface T{\n  name:string\n  age:number\n}\ninterface K{\n  age:number\n}\n//效果 {\n  name:string\n}\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("Record")]),s._v(" "),e("p",[s._v("直接上代码吧")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("type Record<K extends keyof any, T> = {\n  [P in K]: T;\n};\ntype petsGroup = 'dog' | 'cat';\ninterface IPetInfo {\n  name:string,\n  age:number,\n}\n\ntype IPets = Record<petsGroup, IPetInfo>;\n效果 {\n  dog:{\n    name:string,\n    age:number,\n  }\n  cat:{\n    name:string,\n    age:number,\n  }\n}\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br"),e("span",{staticClass:"line-number"},[s._v("11")]),e("br"),e("span",{staticClass:"line-number"},[s._v("12")]),e("br"),e("span",{staticClass:"line-number"},[s._v("13")]),e("br"),e("span",{staticClass:"line-number"},[s._v("14")]),e("br"),e("span",{staticClass:"line-number"},[s._v("15")]),e("br"),e("span",{staticClass:"line-number"},[s._v("16")]),e("br"),e("span",{staticClass:"line-number"},[s._v("17")]),e("br"),e("span",{staticClass:"line-number"},[s._v("18")]),e("br"),e("span",{staticClass:"line-number"},[s._v("19")]),e("br"),e("span",{staticClass:"line-number"},[s._v("20")]),e("br")])])]),s._v(" "),e("li",[e("p",[s._v("ReturnType"),e("T")],1),s._v(" "),e("p",[s._v("函数的返回类型")])]),s._v(" "),e("li",[e("p",[s._v("Parameters"),e("F")],1),s._v(" "),e("p",[s._v("返回一个函数的所有参数类型")])]),s._v(" "),e("li",[e("p",[s._v("ConstructorParameters"),e("C")],1)])]),s._v(" "),e("p",[s._v("获取一个类构造函数的参数类型")]),s._v(" "),e("ul",[e("li",[e("p",[s._v("Readonly")]),s._v(" "),e("p",[s._v("看名字你就知道了，变成只读")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("type Readonly<T>\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])])])]),s._v(" "),e("h3",{attrs:{id:"这些工具函数确实在有些时候可以帮助我们少定义类型而且让代码更加灵活-其实这些都来自于2-8加入的关键字"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#这些工具函数确实在有些时候可以帮助我们少定义类型而且让代码更加灵活-其实这些都来自于2-8加入的关键字"}},[s._v("#")]),s._v(" 这些工具函数确实在有些时候可以帮助我们少定义类型而且让代码更加灵活，其实这些都来自于2.8加入的关键字")]),s._v(" "),e("p",[e("code",[s._v("extend")]),s._v(" "),e("code",[s._v("infer")])]),s._v(" "),e("ul",[e("li",[s._v("extend")])]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("T extends U ? X : Y\n//这个的意思是当T继承U时返回X，否则返回Y。你当做js里的?:效果来看就好了\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br")])]),e("ul",[e("li",[s._v("infer\ninfer只能在"),e("code",[s._v("True")]),s._v("分支里用，这个很重要")])]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("刚刚将的ReturnType的实现\n// 内置 ReturnType\ntype ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;\n\n\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br")])])])}),[],!1,null,null,null);n.default=t.exports}}]);