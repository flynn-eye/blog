(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{603:function(s,n,e){s.exports=e.p+"assets/img/C13D1E57-9B41-4860-B875-5E07ECF2E964.b22ba8ce.png"},604:function(s,n,e){s.exports=e.p+"assets/img/v2-f80e3869ba3c5ceb8dace677820fa09a_1440w.d1d1914f.jpg"},636:function(s,n,e){"use strict";e.r(n);var a=e(14),t=Object(a.a)({},(function(){var s=this,n=s.$createElement,a=s._self._c||n;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("hr"),s._v(" "),a("h1",{attrs:{id:"redux源码简单分析"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#redux源码简单分析"}},[s._v("#")]),s._v(" redux源码简单分析")]),s._v(" "),a("h2",{attrs:{id:"前言"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#前言"}},[s._v("#")]),s._v(" 前言")]),s._v(" "),a("p",[s._v("网上有很多的redux分析源码的文章，我前几天发现redux目前是用ts重构过的，而网上ts版的分析很少，我也便站在巨人的肩膀上，尝试着分析一下redux。(阅读文章之前希望你使用过redux，对redux概念有一定了解)")]),s._v(" "),a("h2",{attrs:{id:"准备"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#准备"}},[s._v("#")]),s._v(" 准备")]),s._v(" "),a("p",[a("img",{attrs:{src:e(603),alt:"redux项目结构"}})]),s._v(" "),a("p",[s._v("这个是redux的源码结构，types文件夹下定义的是类型文件，utils文件夹下的是一下工具函数，其他的外面的js函数是暴露出来供我们使用的函数，看看这些名字是不是有一点熟悉。通常index.js是项目的入口文件。")]),s._v(" "),a("h3",{attrs:{id:"分析index-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析index-ts"}},[s._v("#")]),s._v(" 分析"),a("code",[s._v("index.ts")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("在最前面export的都是类型文件\nexport {\n  createStore,\n  combineReducers,\n  bindActionCreators,\n  applyMiddleware,\n  compose,\n  __DO_NOT_USE__ActionTypes 需要用到的actiontype\n}\n最底下的是我们要用到的函数\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br")])]),a("h3",{attrs:{id:"分析createstore-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析createstore-ts"}},[s._v("#")]),s._v(" 分析"),a("code",[s._v("createStore.ts")])]),s._v(" "),a("p",[a("strong",[s._v("接收三个参数")])]),s._v(" "),a("ul",[a("li",[s._v("reducer：就是 reducer，根据 action 和 currentState 计算 newState 的纯Function")]),s._v(" "),a("li",[s._v("preloadedState：初始化state")]),s._v(" "),a("li",[s._v("enhancer：增强store的功能，让它拥有第三方的功能\n"),a("strong",[s._v("返回值")])])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("const store = ({\n    dispatch: dispatch as Dispatch<A>,\n    subscribe,\n    getState,\n    replaceReducer,\n    [$$observable]: observable\n  } as unknown) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext\n  return store\n  这是一个store容器 有如下的方法\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br")])]),a("p",[s._v("我们先从返回的内容来分析吧")]),s._v(" "),a("ul",[a("li",[s._v("dispatch")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("function dispatch(action: A) {\n    if (!isPlainObject(action)) {\n      //判断action是不是纯对象，不是报错\n      throw new Error(\n        'Actions must be plain objects. ' +\n          'Use custom middleware for async actions.'\n      )\n    }\n\n    if (typeof action.type === 'undefined') {\n      //actiontype===undefined报错\n      throw new Error(\n        'Actions may not have an undefined \"type\" property. ' +\n          'Have you misspelled a constant?'\n      )\n    }\n\n    if (isDispatching) {\n      throw new Error('Reducers may not dispatch actions.')\n    }\n\n    try {\n      //isDispathing改为true 使用reduncer改变状态树\n      isDispatching = true\n      currentState = currentReducer(currentState, action)\n    } finally {\n      isDispatching = false\n    }\n    // 获取所有的监听事件，并执行 subscribe相关\n    const listeners = (currentListeners = nextListeners)\n    for (let i = 0; i < listeners.length; i++) {\n      const listener = listeners[i]\n      listener()\n    }\n  //返回action\n    return action\n  }\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br")])]),a("ul",[a("li",[s._v("subscribe")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("function subscribe(listener: () => void) {\n  //假如listener 不是function报错\n    if (typeof listener !== 'function') {\n      throw new Error('Expected the listener to be a function.')\n    }\n// isDispatching为true报错\n    if (isDispatching) {\n      throw new Error(\n        'You may not call store.subscribe() while the reducer is executing. ' +\n          'If you would like to be notified after the store has been updated, subscribe from a ' +\n          'component and invoke store.getState() in the callback to access the latest state. ' +\n          'See https://redux.js.org/api/store#subscribelistener for more details.'\n      )\n    }\n\n    let isSubscribed = true\n    // 这里做了一次浅拷贝，之久再说为啥需要\n    ensureCanMutateNextListeners()\n    // 直接将监听的函数放进nextListeners里\n    nextListeners.push(listener)\n    //返回取消订阅函数\n    return function unsubscribe() {\n      if (!isSubscribed) {\n        return\n      }\n\n      if (isDispatching) {\n        throw new Error(\n          'You may not unsubscribe from a store listener while the reducer is executing. ' +\n            'See https://redux.js.org/api/store#subscribelistener for more details.'\n        )\n      }\n      //修改这个订阅状态\n      isSubscribed = false\n      //数组移到订阅函数位置，取消订阅\n      ensureCanMutateNextListeners()\n      const index = nextListeners.indexOf(listener)\n      nextListeners.splice(index, 1)\n      currentListeners = null\n    }\n  }\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br"),a("span",{staticClass:"line-number"},[s._v("38")]),a("br"),a("span",{staticClass:"line-number"},[s._v("39")]),a("br"),a("span",{staticClass:"line-number"},[s._v("40")]),a("br"),a("span",{staticClass:"line-number"},[s._v("41")]),a("br")])]),a("ul",[a("li",[s._v("getState")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("function getState(): S {\n  // 在dispatch时候报错 之后分析为啥会这样设计\n    if (isDispatching) {\n      throw new Error(\n        'You may not call store.getState() while the reducer is executing. ' +\n          'The reducer has already received the state as an argument. ' +\n          'Pass it down from the top reducer instead of reading it from the store.'\n      )\n    }\n    return currentState as S\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br")])]),a("ul",[a("li",[s._v("replaceReducer\n唯一的参数是nextReducer")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v(" function replaceReducer<NewState, NewActions extends A>(\n    nextReducer: Reducer<NewState, NewActions>\n  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {\n    //必须为function\n    if (typeof nextReducer !== 'function') {\n      throw new Error('Expected the nextReducer to be a function.')\n    }\n\n    // TODO: do this more elegantly\n    ;((currentReducer as unknown) as Reducer<\n      NewState,\n      NewActions\n    >) = nextReducer\n\n    // This action has a similar effect to ActionTypes.INIT.\n    // Any reducers that existed in both the new and old rootReducer\n    // will receive the previous state. This effectively populates\n    // the new state tree with any relevant data from the old one.\n    // 生成新的替代state树\n    dispatch({ type: ActionTypes.REPLACE } as A)\n    // change the type of the store by casting it to the new store\n    //返回新的store\n    return (store as unknown) as Store<\n      ExtendState<NewState, StateExt>,\n      NewActions,\n      StateExt,\n      Ext\n    > &\n      Ext\n  }\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br")])]),a("ul",[a("li",[s._v("其他")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("let currentReducer = reducer\nlet currentState = preloadedState as S\nlet currentListeners: (() => void)[] | null = []\nlet nextListeners = currentListeners\nlet isDispatching = false\n\n/**\n * This makes a shallow copy of currentListeners so we can use\n * nextListeners as a temporary list while dispatching.\n *\n * This prevents any bugs around consumers calling\n * subscribe/unsubscribe in the middle of a dispatch.\n */\nfunction ensureCanMutateNextListeners() {\n  if (nextListeners === currentListeners) {\n    nextListeners = currentListeners.slice()\n  }\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br")])]),a("blockquote",[a("p",[s._v("其中为什么需要isDispatching，为什么需要nextListeners，currentListeners两个来保存监听器，还有之前提到的浅拷贝函数ensureCanMutateNextListeners。当我们在触发执行listners的过程中如果，我们添加或者删除了订阅，那一定会发生一些意想不到的效果，于是redux在dispatch时生成了一个snapshot来保存要执行的listners，即使现在的listners改变了，仍然执行的是snapshot，改变只会影响下一次。")])]),s._v(" "),a("h3",{attrs:{id:"分析combinereducer-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析combinereducer-ts"}},[s._v("#")]),s._v(" 分析"),a("code",[s._v("combineReducer.ts")])]),s._v(" "),a("p",[a("sub",[s._v("该文件导出了combineReducers函数，还定义了一些内部使用的辅助方法。我们先从combineReducers开始吧")])]),s._v(" "),a("ul",[a("li",[s._v("combineReducers将多个reducers合并成一个")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("export default function combineReducers(reducers: ReducersMapObject) {\n  //获取reducers的key值\n  const reducerKeys = Object.keys(reducers)\n  //字面意思最终的reducers\n  const finalReducers: ReducersMapObject = {}\n  for (let i = 0; i < reducerKeys.length; i++) {\n    const key = reducerKeys[i]\n    if (process.env.NODE_ENV !== 'production') {\n      if (typeof reducers[key] === 'undefined') {\n        warning(`No reducer provided for key \"${key}\"`)\n      }\n    }\n    //只支持function类型\n    if (typeof reducers[key] === 'function') {\n      finalReducers[key] = reducers[key]\n    }\n  }\n  const finalReducerKeys = Object.keys(finalReducers)\n\n  // 异常缓存\n  let unexpectedKeyCache: { [key: string]: true }\n  if (process.env.NODE_ENV !== 'production') {\n    //不在开发环境就初始化\n    unexpectedKeyCache = {}\n  }\n  // 之后分析哪些会报错，以及处理的函数\n  let shapeAssertionError: Error\n  try {\n    assertReducerShape(finalReducers)\n  } catch (e) {\n    shapeAssertionError = e\n  }\n  // 返回一个闭包函数\n  return function combination(\n    state: StateFromReducersMapObject<typeof reducers> = {},\n    action: AnyAction\n  ) {\n    //开发环境才会报错\n    if (shapeAssertionError) {\n      throw shapeAssertionError\n    }\n    if (process.env.NODE_ENV !== 'production') {\n      const warningMessage = \n      //这个函数之后解析\n      getUnexpectedStateShapeWarningMessage(\n        state,\n        finalReducers,\n        action,\n        unexpectedKeyCache\n      )\n      if (warningMessage) {\n        warning(warningMessage)\n      }\n    }\n    //初始化flag\n    let hasChanged = false\n    //合并之后的state\n    const nextState: StateFromReducersMapObject<typeof reducers> = {}\n    //循环合并state，并且判断状态数有无改变\n    for (let i = 0; i < finalReducerKeys.length; i++) {\n      const key = finalReducerKeys[i]\n      const reducer = finalReducers[key]\n      const previousStateForKey = state[key]\n      \n      const nextStateForKey = reducer(previousStateForKey, action)\n      if (typeof nextStateForKey === 'undefined') {\n        const errorMessage = getUndefinedStateErrorMessage(key, action)\n        throw new Error(errorMessage)\n      }\n      nextState[key] = nextStateForKey\n      hasChanged = hasChanged || nextStateForKey !== previousStateForKey\n    }\n    hasChanged =\n      hasChanged || finalReducerKeys.length !== Object.keys(state).length\n    return hasChanged ? nextState : state\n  }\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br"),a("span",{staticClass:"line-number"},[s._v("38")]),a("br"),a("span",{staticClass:"line-number"},[s._v("39")]),a("br"),a("span",{staticClass:"line-number"},[s._v("40")]),a("br"),a("span",{staticClass:"line-number"},[s._v("41")]),a("br"),a("span",{staticClass:"line-number"},[s._v("42")]),a("br"),a("span",{staticClass:"line-number"},[s._v("43")]),a("br"),a("span",{staticClass:"line-number"},[s._v("44")]),a("br"),a("span",{staticClass:"line-number"},[s._v("45")]),a("br"),a("span",{staticClass:"line-number"},[s._v("46")]),a("br"),a("span",{staticClass:"line-number"},[s._v("47")]),a("br"),a("span",{staticClass:"line-number"},[s._v("48")]),a("br"),a("span",{staticClass:"line-number"},[s._v("49")]),a("br"),a("span",{staticClass:"line-number"},[s._v("50")]),a("br"),a("span",{staticClass:"line-number"},[s._v("51")]),a("br"),a("span",{staticClass:"line-number"},[s._v("52")]),a("br"),a("span",{staticClass:"line-number"},[s._v("53")]),a("br"),a("span",{staticClass:"line-number"},[s._v("54")]),a("br"),a("span",{staticClass:"line-number"},[s._v("55")]),a("br"),a("span",{staticClass:"line-number"},[s._v("56")]),a("br"),a("span",{staticClass:"line-number"},[s._v("57")]),a("br"),a("span",{staticClass:"line-number"},[s._v("58")]),a("br"),a("span",{staticClass:"line-number"},[s._v("59")]),a("br"),a("span",{staticClass:"line-number"},[s._v("60")]),a("br"),a("span",{staticClass:"line-number"},[s._v("61")]),a("br"),a("span",{staticClass:"line-number"},[s._v("62")]),a("br"),a("span",{staticClass:"line-number"},[s._v("63")]),a("br"),a("span",{staticClass:"line-number"},[s._v("64")]),a("br"),a("span",{staticClass:"line-number"},[s._v("65")]),a("br"),a("span",{staticClass:"line-number"},[s._v("66")]),a("br"),a("span",{staticClass:"line-number"},[s._v("67")]),a("br"),a("span",{staticClass:"line-number"},[s._v("68")]),a("br"),a("span",{staticClass:"line-number"},[s._v("69")]),a("br"),a("span",{staticClass:"line-number"},[s._v("70")]),a("br"),a("span",{staticClass:"line-number"},[s._v("71")]),a("br"),a("span",{staticClass:"line-number"},[s._v("72")]),a("br"),a("span",{staticClass:"line-number"},[s._v("73")]),a("br"),a("span",{staticClass:"line-number"},[s._v("74")]),a("br"),a("span",{staticClass:"line-number"},[s._v("75")]),a("br"),a("span",{staticClass:"line-number"},[s._v("76")]),a("br")])]),a("h3",{attrs:{id:"分析applymiddleware-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析applymiddleware-ts"}},[s._v("#")]),s._v(" "),a("code",[s._v("分析applyMiddleware.ts")])]),s._v(" "),a("p",[a("sub",[s._v("接收的参数middlewares数组或者...middlewares，返回一个闭包，参数接收有个store,闭包函数返回一个store并用增强的dispatch替换他，所以echancer只增强了dispatch")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("return (createStore: StoreEnhancerStoreCreator) => <S, A extends AnyAction>(\n   reducer: Reducer<S, A>,\n   preloadedState?: PreloadedState<S>\n ) => {\n   //创建store\n   const store = createStore(reducer, preloadedState)\n   新建一个抛异常的dispatch\n   let dispatch: Dispatch = () => {\n     throw new Error(\n       'Dispatching while constructing your middleware is not allowed. ' +\n         'Other middleware would not be applied to this dispatch.'\n     )\n   }\n\n   const middlewareAPI: MiddlewareAPI = {\n     getState: store.getState,\n     dispatch: (action, ...args) => dispatch(action, ...args)\n   }\n   //调用middleware，并把最初的dispatch放进去\n   const chain = middlewares.map(middleware => middleware(middlewareAPI))\n   //强化的dispatch\n   dispatch = compose<typeof dispatch>(...chain)(store.dispatch)\n\n   return {\n     ...store,\n     dispatch\n   }\n }\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br")])]),a("h3",{attrs:{id:"分析compose-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析compose-ts"}},[s._v("#")]),s._v(" "),a("code",[s._v("分析compose.ts")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("export default function compose(...funcs: Function[]) {\n if (funcs.length === 0) {\n   // infer the argument type so it is usable in inference down the line\n   return <T>(arg: T) => arg\n }\n\n if (funcs.length === 1) {\n   return funcs[0]\n }\n //看到这个函数我震惊了，reduce居然有这种操作\n return funcs.reduce((a, b) => (...args: any) => a(b(...args)))\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br")])]),a("h3",{attrs:{id:"分析bindactioncreator-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析bindactioncreator-ts"}},[s._v("#")]),s._v(" "),a("code",[s._v("分析bindActionCreator.ts")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("function bindActionCreator<A extends AnyAction = AnyAction>(\n  actionCreator: ActionCreator<A>,\n  dispatch: Dispatch\n) {\n\n  return function (this: any, ...args: any[]) {\n    return dispatch(actionCreator.apply(this, args))\n  }\n}\n\nexport default function bindActionCreators(\n  actionCreators: ActionCreator<any> | ActionCreatorsMapObject,\n  dispatch: Dispatch\n) {\n  //如果是单个方法直接调用bindActionCreator\n  if (typeof actionCreators === 'function') {\n    return bindActionCreator(actionCreators, dispatch)\n  }\n\n  if (typeof actionCreators !== 'object' || actionCreators === null) {\n    throw new Error(\n      `bindActionCreators expected an object or a function, instead received ${\n        actionCreators === null ? 'null' : typeof actionCreators\n      }. ` +\n        `Did you write \"import ActionCreators from\" instead of \"import * as ActionCreators from\"?`\n    )\n  }\n  //是object的处理方法\n  const boundActionCreators: ActionCreatorsMapObject = {}\n  for (const key in actionCreators) {\n    const actionCreator = actionCreators[key]\n    if (typeof actionCreator === 'function') {\n      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)\n    }\n  }\n  return boundActionCreators\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br")])]),a("h3",{attrs:{id:"util相关"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#util相关"}},[s._v("#")]),s._v(" "),a("code",[s._v("util相关")])]),s._v(" "),a("ul",[a("li",[s._v("判断plainobject")])]),s._v(" "),a("p",[a("img",{attrs:{src:e(604),alt:"不同库对plainobject判断"}})]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("isPlainObject.ts\n// https://www.zhihu.com/question/287632207/answer/458261384 这个文章分析了redux的判断朴素对象，确实当我看到的时候，感觉和其他的库判断不一样,通常朴素对象是指{}或者  new出来的  而redux希望 是由{}创建的，new也会报错\nexport default function isPlainObject(obj: any): boolean {\n  if (typeof obj !== 'object' || obj === null) return false\n\n  let proto = obj\n  while (Object.getPrototypeOf(proto) !== null) {\n    proto = Object.getPrototypeOf(proto)\n  }\n\n  return Object.getPrototypeOf(obj) === proto\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br")])]),a("h3",{attrs:{id:"分析actiontype-ts"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#分析actiontype-ts"}},[s._v("#")]),s._v(" 分析"),a("code",[s._v("actiontype.ts")])]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("const randomString = () =>\n  Math.random().toString(36).substring(7).split('').join('.')\n\nconst ActionTypes = {\n  //初始化\n  INIT: `@@redux/INIT${/* #__PURE__ */ randomString()}`,\n  //替换\n  REPLACE: `@@redux/REPLACE${/* #__PURE__ */ randomString()}`,\n  //default\n  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br")])]),a("h1",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[s._v("#")]),s._v(" 总结")]),s._v(" "),a("p",[a("strong",[s._v("redux的设计模式十分精巧，尤其是plainObject的判断和其他库的定义有点不一样，ts版的redux类型定义就好像最佳实践一样可以很好的借鉴，用在工作中")])])])}),[],!1,null,null,null);n.default=t.exports}}]);