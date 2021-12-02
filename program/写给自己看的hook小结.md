---

title: 写给自己看的hook小结

meta:
  - name: description
    content: 写给自己看的hook小结
  - name: keywords
    content: hook

created: 2020/08/10

updated: 2020/08/10
---

---

# 前言
最近一直在深入研究react，加上工作有点忙，没时间写博客了，把自己以前写在简书上的文章搬过来。

##### react16推出了react hook，react hook使得functional组件拥有了class组件的一些特性，hook不能用在class 组件里。

**React 中提供的 常用的hooks：**

- useState：setState
- useReducer：setState
- useRef: ref
- useContext: context，需配合 createContext 使用
- useMemo: 可以对 setState 的优化
- useEffect: 类似 componentDidMount/Update, componentWillUnmount，当效果为 componentDidMount/Update 时，总是在整个更新周期的最后（页面渲染完成后）才执行
- useLayoutEffect: 用法与 useEffect 相同，区别在于该方法的回调会在数据更新完成后，页面渲染之前进行，该方法会阻碍页面的渲染

##### useState

```
function Counter({ initialCount }) {
  const [count, setCount] = useState(0)
  return (
    <>
      Count: {count}
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={() => setCount(prevCount => prevCount + 1)}>+</button>
      <button onClick={() => setCount(prevCount => prevCount - 1)}>-</button>
    </>
  )
}

```

useState 有一个参数，该参数可传如**任意类型的值**或者**返回任意类型值的函数**。

useState 返回值为一个数组，数组的**第一个参数为我们需要使用的 state，第二个参数为一个`setter`函数，可传任意类型的变量，或者一个接收 state 旧值的函数，其返回值作为 state 新值。**

##### useReducer

useReducer 接收三个参数，**第一个参数为一个 reducer 函数**，**第二个参数是reducer的初始值**，**第三个参数为可选参数，值为一个函数，可以用来惰性提供初始状态**。这意味着我们可以使用使用一个 `init` 函数来计算初始状态/值，而不是显式的提供值。如果初始值可能会不一样，这会很方便，最后会用计算的值来代替初始值。

reducer 接受两个参数一个是 state 另一个是 action ，用法原理和 redux 中的 reducer 一致。

useReducer 返回一个数组，数组中包含一个 state 和 dispath，state 是返回状态中的值，而 dispatch 是一个可以发布事件来更新 state 的函数。

```
function init(initialCount) { 
    return {count: initialCount}; 
} 

function reducer(state, action) { 
    switch (action.type) { 
        case 'increment': 
            return {count: state.count + 1}; 
        case 'decrement': 
            return {count: state.count - 1}; 
        case 'reset': 
            return init(action.payload); 
        default: 
            throw new Error(); 
    } 
} 

function Counter({initialCount}) { 
    const [state, dispatch] = useReducer(reducer, initialCount, init); 
    return ( 
        <> 
        Count: {state.count} 
<button 
    onClick={() => dispatch({type: 'reset', payload: initialCount})}> 
    Reset 
</button> 
<button onClick={() => dispatch({type: 'increment'})}>+</button> 
<button onClick={() => dispatch({type: 'decrement'})}>-</button> 
</> 
); 
} 

function render () { 
    ReactDOM.render(<Counter initialCount={0} />, document.getElementById('root')); 
}

```

##### useEffect 和 useLayoutEffect

这个两个hook差不多只有轻微的执行顺序上的不同先从`useEffect`说起吧

```
useEffect(func, array);
```

第一个参数为 effect 函数，该函数将在 componentDidMmount 时触发和 componentDidUpdate 时有条件触发（该添加为 useEffect 的第二个数组参数）。同时该 effect 函数可以返回一个函数（returnFunction），returnFunction 将会**在 componentWillUnmount 时触发**和**在 componentDidUpdate 时先于 effect 有条件触发（先执行 returnFuncton 再执行 effect，比如需要做定时器的清除）**。 **注意：** 与 componentDidMount 和 componentDidUpdate 不同之处是，effect 函数触发时间为在浏览器完成渲染之后。 如果需要在渲染之前触发，需要使用 useLayoutEffect。

第二个参数 array 作为有条件触发情况时的条件限制：

- 如果不传，则每次 componentDidUpdate 时都会先触发 returnFunction（如果存在），再触发 effect。
- 如果为空数组`[]`，componentDidUpdate 时不会触发 returnFunction 和 effect。
- 如果只需要在指定变量变更时触发 returnFunction 和 effect，将该变量放入数组。

##### useContext

看名字就知道是react里context的hook

```
const Context = React.createContext('light');
// Provider
class Provider extends Component {
  render() {
    return (
      <Context.Provider value={'dark'}>
        <DeepTree />
      </Context.Provider>
    )
  }
}
// Consumer
function Consumer(props) {
  const context = useContext(Context)
  return (
    <div>
      {context} // dark
    </div>
  )
}
```

##### useRef

```
import { React, useRef } from 'react'
const FocusInput = () => {
  const inputElement = useRef()
  const handleFocusInput = () => {
    inputElement.current.focus()
  }
  return (
    <>
      <input type='text' ref={inputElement} />
      <button onClick={handleFocusInput}>Focus Input</button>
    </>
  )
}
export default FocusInput
```

与createRef比 ，useRef创建的对象每次都返回一个相同的引用而createRef每次渲染都会返回一个新的引用

##### useMemo

在没有hook时我们通常组件优化会用到pureComponent 之后又有为函数设计的memo方法，通过策略来判断是否更新。

```
// 使用useMemo
import React, { useState,useMemo, memo } from 'react'

const Child = memo(({ config }) => {
    console.log(config)
    return <div style={{ color:config.color }}>{config.text}</div>
})

function MemoCount() {
    const [count, setCount] = useState(0)
    const [color, setColor] = useState('blue')
    // 只会根据color的改变来返回不同的对象，否则都会返回同一个引用对象
    const config = useMemo(()=>({
        color,
        text:color
    }),[color])
    
    return (
        <div>
            <button
                onClick={() => {
                    setCount(count + 1)
                }}
                >
                Update Count
            </button>
            <button
                onClick={() => {
                    setColor('green')
                }}
                >
                Update Color
            </button>
            <div>{count}</div>
            <Child config={config} />
        </div>
    )
}

export default MemoCount

```



