---

title: Vue3.0 proxy代替Object.defineProperty()实现数据劫持

meta:
  - name: description
    content: Vue3.0 proxy代替Object.defineProperty()实现数据劫持
  - name: keywords
    content: proxy ,Vue 

created: 2020/05/02

updated: 2020/05/02
 
tags:
  - proxy
  - Vue

---


大家都熟悉Vue中依靠`Object.defineProperty()`来进行数据劫持,他像一个拦截器一样监控着一个对象上属性的改变。但是并不能深度监测到对象属性的变化，虽然Vue重写了一些array的原型链上的方法，如`push()`、`shift()`等，Vue官方也提供了方法`Vue.set( target, propertyName/index, value )`（target可以是数组也可以是对象）来解决这些问题，但是手动操作很不方便。

在Vue迎来3.0更新的时候，同样Vue将用`proxy`来实现数据劫持，接下来介绍介绍`proxy`有什么方便的地方吧。

[MDN的proxy文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

`proxy`语法如下 

```
// const p = new Proxy(target, handler)
const handler = {
    get: function(obj, prop) {
        return prop in obj ? obj[prop] : 37;
    }
};

const p = new Proxy({}, handler);
p.a = 1;
p.b = undefined;

console.log(p.a, p.b);      // 1, undefined
console.log('c' in p, p.c); // false, 37
```

很显然`proxy`相比`Object.defineProperty()`可以拦截属性的添加了，proxy不仅仅只有get，set拦截操作

[`handler.getPrototypeOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getPrototypeOf)

[`handler.setPrototypeOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/setPrototypeOf)

[`handler.isExtensible()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/isExtensible)

[`handler.preventExtensions()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/preventExtensions)

[`handler.getOwnPropertyDescriptor()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor)

[`handler.defineProperty()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/defineProperty)

[`handler.has()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has)

[`handler.get()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get)

[`handler.set()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set)

[`handler.deleteProperty()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/deleteProperty)

[`handler.ownKeys()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/ownKeys)

[`handler.apply()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/apply)

[`handler.construct()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/construct)

这些都可以很多方法操作进行拦截

同样Vue3.0在实现数据劫持的时候还用到了Reflect属性

[MDN的Reflect文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)

与大多数全局对象不同，`Reflect`不是一个构造函数。你不能将其与一个new运算符一起使用，或者将`Reflect`对象作为一个函数来调用。`Reflect`的所有属性和方法都是静态的（就像Math对象）。它可以修改一个对象的属性等。在这里不再赘述。

使用`proxy`实现双向绑定

```
 <div id="app">
      <input type="text" id="input" />
      <div>您输入的是： <span id="title"></span></div>
      <button type="button" name="button" id="btn">添加到todolist</button>
      <ul id="list"></ul>
 </div>
    const obj = {};
    const input = document.getElementById("input");
    const title = document.getElementById("title");
    
    const newObj = new Proxy(obj, {
      get: function(target, key, receiver) {
        console.log(`getting ${key}!`);
        return Reflect.get(target, key, receiver);
      },
      set: function(target, key, value, receiver) {
        console.log(target, key, value, receiver);
        if (key === "text") {
          input.value = value;
          title.innerHTML = value;
        }
        return Reflect.set(target, key, value, receiver);
      }
    });

    input.addEventListener("keyup", function(e) {
      newObj.text = e.target.value;
    });
 

```

