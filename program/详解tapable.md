---

title: 详解tapable

meta:
  - name: description
    content: 详解tapable

created: 2021/01/17

updated: 2021/01/17
 
---
*最近在深入学习webpack，发现tapable是一个很重要的东西，写一篇文章记录一下。*

*有node经验的都知道，node是一个事件驱动的js runtime,我们发现很多的模块都继承于Event的模块，基于发布订阅的这种模式，让程序非常的有条理。而webpack的打包机制大量采用了这种方式，其中compiler和compilation都继承与tapable，我不知道把这个单词翻译成啥，但是发现tap的有水龙头，放水的意思，这有种事件流的感觉。*

### 钩子简介
- 基础钩子
> 分为同步钩子和异步钩子，异步钩子有两种，串行并行，串行指执行完上面的才会执行下一个，并行是指两个一起执行，比如
```
setTimeout(()=>{
    console.log('aa')
},1000)
setTimeout(()=>{
    console.log('bb')
},2000)
串行会在打印aa2秒后在打印bb
并行会在打印aa1s后打印bb
```

` 每个构造函数的参数是一个数组吗，传几个参数就放几个长度的数组  `
```
new SyncHook(['arg1','arg2']);在调用的时候可以传入两个参数
```
|  类   | 功能  |
|  ----  | ----  |
| SyncHook | 同步钩子 |
| AsyncParallelHook | 异步并行钩子 |
| AsyncSeriesHook | 异步串行钩子 |

- 修饰钩子

|  类   | 功能  |
|  ----  | ----  |
| bail | 保险类型，当一个事件回调在运行时返回的值不为 undefined 时，停止后面事件回调的执行。 |
| waterfall | 瀑布类型，如果当前执行的事件回调返回值不为 undefined，那么就把下一个事件回调的第一个参数替换成这个值。 |
| loop | 循环类型，如果当前执行的事件回调的返回值不是 undefined，重新从第一个注册的事件回调处执行，直到当前执行的事件回调没有返回值。 |


- 注册方法

`第一个参数string,事件名称,第二个参数回调方法`

```
**.tap({
    name:'xx', //type: string
    stage: 10 // type:number default 0 ，越大执行越晚
})
```

| 方法 | 功能 |
|  ----  | ----  |
| tap | 同步注册 |
| tapAsync | 异步的注册 |
| tap | 异步注册接收promise，第二个参数function是promise |

- 调用方法

` 第一个参数string，后面的参数为回调函数的参数 `

| 方法 | 功能 |
|  ----  | ----  |
| call | 同步注册 |
| callAsync | 异步的注册 |
| callPromise | promise注册的用promise调用 |

- 拦截器
如果你用过`axios`那拦截器你一定不陌生，tapable也有拦截器
```
hook.intercept({
  // 注册时执行
  register(tap) {
    console.log('register', tap);
    return tap;
  },
  // 触发事件时执行
  call(...args) {
    console.log('call', args);
  },
// 在 call 拦截器之后执行& loop钩子每次循环都会执行
  loop(...args) {
    console.log('loop', args);
  },
  // 事件回调调用前执行
  tap(tap) {
    console.log('tap', tap);
  },
});

```
[github代码](https://github.com/flynn-eye/learnWebpack/blob/master/tapable/index.js)