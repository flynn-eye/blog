---

title: react源码阅读之hooks

meta:
  - name: description
    content: react源码阅读
  - name: keywords
    content: react源码阅读

created: 2020/11/22

updated: 2020/11/22
 
tags:
    - react源码阅读
---

---
# 前言
hook这一特性让functional组件更加强大，社区中有很多hooks库出现，hook注意的三要素如下
- 只能在functional组件中使用
- 不要在循环判断嵌套下使用hook
- 自定义hook use**开头

# 本文阅读最常用的useState和比较复杂的useEffect

# useState
[代码地址](https://github.com/facebook/react/blob/v16.13.1/packages/react/src/ReactHooks.js)
```
export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
    //看来重点在resolveDispatcher里
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function resolveDispatcher() {
    //看看ReactCurrentDispatcher 
  const dispatcher = ReactCurrentDispatcher.current;
  invariant(
    dispatcher !== null,
    '......省略掉.',
  );
  return dispatcher;
}
```
[ReactCurrentDispatcher代码地址](https://github.com/facebook/react/blob/v16.13.1/packages/react/src/ReactCurrentDispatcher.js)

发现整个代码反复套娃都跑到另一个包下面了。
[ReactFiberHooks代码地址](https://github.com/facebook/react/blob/v16.13.1/packages/react-reconciler/src/ReactFiberHooks.js)这个包下面定义了类型，我没学过flow就当做typescript来看吧,搜索一下发现这个文件有一堆useState方法，当时我就傻了，之后发现他们在不同的对象内，看名字是实在不同生命周期，先看看HooksDispatcherOnMountInDEV里的吧
```
  useState<S>(
      initialState: (() => S) | S,
    ): [S, Dispatch<BasicStateAction<S>>] {
      currentHookNameInDev = 'useState';
      mountHookTypesDev();
      const prevDispatcher = ReactCurrentDispatcher.current;
      ReactCurrentDispatcher.current = InvalidNestedHooksDispatcherOnMountInDEV;
      try {
        return mountState(initialState);
      } finally {
        ReactCurrentDispatcher.current = prevDispatcher;
      }
    },
```
