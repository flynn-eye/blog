---

title: redux源码阅读

meta:
  - name: description
    content: redux源码阅读
  - name: keywords
    content: redux ,源码

created: 2020/10/18

updated: 2020/10/18
 
tags:
  - redux
  - 源码
---

---

# redux源码简单分析
## 前言

网上有很多的redux分析源码的文章，我前几天发现redux目前是用ts重构过的，而网上ts版的分析很少，我也便站在巨人的肩膀上，尝试着分析一下redux。(阅读文章之前希望你使用过redux，对redux概念有一定了解)

## 准备

![redux项目结构](../../public/pic/source/C13D1E57-9B41-4860-B875-5E07ECF2E964.png)

这个是redux的源码结构，types文件夹下定义的是类型文件，utils文件夹下的是一下工具函数，其他的外面的js函数是暴露出来供我们使用的函数，看看这些名字是不是有一点熟悉。通常index.js是项目的入口文件。

### 分析`index.ts`
```
在最前面export的都是类型文件
export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes 需要用到的actiontype
}
最底下的是我们要用到的函数
```
### 分析`createStore.ts`
**接收三个参数**
- reducer：就是 reducer，根据 action 和 currentState 计算 newState 的纯Function
- preloadedState：初始化state
- enhancer：增强store的功能，让它拥有第三方的功能
**返回值**
```
const store = ({
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
  这是一个store容器 有如下的方法
```
我们先从返回的内容来分析吧
- dispatch
```
function dispatch(action: A) {
    if (!isPlainObject(action)) {
      //判断action是不是纯对象，不是报错
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    if (typeof action.type === 'undefined') {
      //actiontype===undefined报错
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      //isDispathing改为true 使用reduncer改变状态树
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }
    // 获取所有的监听事件，并执行 subscribe相关
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
  //返回action
    return action
  }
```
- subscribe
```
function subscribe(listener: () => void) {
  //假如listener 不是function报错
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }
// isDispatching为true报错
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    let isSubscribed = true
    // 这里做了一次浅拷贝，之久再说为啥需要
    ensureCanMutateNextListeners()
    // 直接将监听的函数放进nextListeners里
    nextListeners.push(listener)
    //返回取消订阅函数
    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }
      //修改这个订阅状态
      isSubscribed = false
      //数组移到订阅函数位置，取消订阅
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }
```
- getState
```
function getState(): S {
  // 在dispatch时候报错 之后分析为啥会这样设计
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }
    return currentState as S
```
- replaceReducer
唯一的参数是nextReducer
```
 function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    //必须为function
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    // TODO: do this more elegantly
    ;((currentReducer as unknown) as Reducer<
      NewState,
      NewActions
    >) = nextReducer

    // This action has a similar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    // 生成新的替代state树
    dispatch({ type: ActionTypes.REPLACE } as A)
    // change the type of the store by casting it to the new store
    //返回新的store
    return (store as unknown) as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext
  }
  ```
  - 其他
  ```
  let currentReducer = reducer
  let currentState = preloadedState as S
  let currentListeners: (() => void)[] | null = []
  let nextListeners = currentListeners
  let isDispatching = false

  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
  ```
  > 其中为什么需要isDispatching，为什么需要nextListeners，currentListeners两个来保存监听器，还有之前提到的浅拷贝函数ensureCanMutateNextListeners。当我们在触发执行listners的过程中如果，我们添加或者删除了订阅，那一定会发生一些意想不到的效果，于是redux在dispatch时生成了一个snapshot来保存要执行的listners，即使现在的listners改变了，仍然执行的是snapshot，改变只会影响下一次。
  ### 分析`combineReducer.ts`
 ~该文件导出了combineReducers函数，还定义了一些内部使用的辅助方法。我们先从combineReducers开始吧~
- combineReducers将多个reducers合并成一个
```
export default function combineReducers(reducers: ReducersMapObject) {
  //获取reducers的key值
  const reducerKeys = Object.keys(reducers)
  //字面意思最终的reducers
  const finalReducers: ReducersMapObject = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }
    //只支持function类型
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)

  // 异常缓存
  let unexpectedKeyCache: { [key: string]: true }
  if (process.env.NODE_ENV !== 'production') {
    //不在开发环境就初始化
    unexpectedKeyCache = {}
  }
  // 之后分析哪些会报错，以及处理的函数
  let shapeAssertionError: Error
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }
  // 返回一个闭包函数
  return function combination(
    state: StateFromReducersMapObject<typeof reducers> = {},
    action: AnyAction
  ) {
    //开发环境才会报错
    if (shapeAssertionError) {
      throw shapeAssertionError
    }
    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = 
      //这个函数之后解析
      getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }
    //初始化flag
    let hasChanged = false
    //合并之后的state
    const nextState: StateFromReducersMapObject<typeof reducers> = {}
    //循环合并state，并且判断状态数有无改变
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      const previousStateForKey = state[key]
      
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length
    return hasChanged ? nextState : state
  }
 ``` 

 ### `分析applyMiddleware.ts`
 ~接收的参数middlewares数组或者...middlewares，返回一个闭包，参数接收有个store,闭包函数返回一个store并用增强的dispatch替换他，所以echancer只增强了dispatch~
 ```
return (createStore: StoreEnhancerStoreCreator) => <S, A extends AnyAction>(
    reducer: Reducer<S, A>,
    preloadedState?: PreloadedState<S>
  ) => {
    //创建store
    const store = createStore(reducer, preloadedState)
    新建一个抛异常的dispatch
    let dispatch: Dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI: MiddlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    }
    //调用middleware，并把最初的dispatch放进去
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    //强化的dispatch
    dispatch = compose<typeof dispatch>(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
 ```

 ### `分析compose.ts`
 ```
 export default function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }
  //看到这个函数我震惊了，reduce居然有这种操作
  return funcs.reduce((a, b) => (...args: any) => a(b(...args)))
}
```

### `分析bindActionCreator.ts`
```
function bindActionCreator<A extends AnyAction = AnyAction>(
  actionCreator: ActionCreator<A>,
  dispatch: Dispatch
) {

  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export default function bindActionCreators(
  actionCreators: ActionCreator<any> | ActionCreatorsMapObject,
  dispatch: Dispatch
) {
  //如果是单个方法直接调用bindActionCreator
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }
  //是object的处理方法
  const boundActionCreators: ActionCreatorsMapObject = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
```
### `util相关`
- 判断plainobject

![不同库对plainobject判断](../../public/pic/source/v2-f80e3869ba3c5ceb8dace677820fa09a_1440w.jpg)

```
isPlainObject.ts
// https://www.zhihu.com/question/287632207/answer/458261384 这个文章分析了redux的判断朴素对象，确实当我看到的时候，感觉和其他的库判断不一样,通常朴素对象是指{}或者  new出来的  而redux希望 是由{}创建的，new也会报错
export default function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
```

### 分析`actiontype.ts`

```
const randomString = () =>
  Math.random().toString(36).substring(7).split('').join('.')

const ActionTypes = {
  //初始化
  INIT: `@@redux/INIT${/* #__PURE__ */ randomString()}`,
  //替换
  REPLACE: `@@redux/REPLACE${/* #__PURE__ */ randomString()}`,
  //default
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}
```
# 总结
**redux的设计模式十分精巧，尤其是plainObject的判断和其他库的定义有点不一样，ts版的redux类型定义就好像最佳实践一样可以很好的借鉴，用在工作中**