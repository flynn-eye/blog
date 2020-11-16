---

title: Typescript中的工具方法

meta:
  - name: description
    content: Typescript中的工具方法
  - name: keywords
    content: Typescript

created: 2020/11/16

updated: 2020/11/16
 
tags:
  - Typescript
---

---
# Typescript中的工具方法

## 前言
 最近好久不写博客了，一直忙着深入学习React,并带入工程实践当中。在工作中使用Angular，还是业余使用React，我都会用`Typescript`但是国内的大部分文章还停留在，一些简单的OOP上，或者强调Typescript的一些配置上，最近发现ts还有一些工具方法，我居然知道的不全，话说Typescript的文档感觉比react的还乱。希望自己敲一遍能有一个总结

- Partial
  
  将其变为可选
  ```
  interface People {
    name: string
  }

  Partial<People>
  -----
  效果
  /*{
  * name?: string
  }*/

  ```
- Required

  与Partial相反，变为不可选
  ```
  我就不写代码了哈
  ```
- Pick<T,K>
   
  从T中取出K的属性
  ```
  type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };
  type NewPerson = Pick<People, 'name'>; //效果 { name: string; }
  ```
- Exclude<T,K>

  从T中移除K的属性

- Extract<T,K>

  返回T,K的交集
  ```
  interface T{
    name:string
    age:number
  }
  interface K{
    age:number
  }
  效果是  {
    age:number
  }
  ```
- NonNullable<T>

  和Exclude效果差不多相当于帮你定义了第二个参数，把null|undefined移除
- Omit<T,K>

  像Pick和Exclude的结合
  把返回T中有，K中没有的
  ```
  interface T{
    name:string
    age:number
  }
  interface K{
    age:number
  }
  //效果 {
    name:string
  }
  ```
- Record

  直接上代码吧
  ```
  type Record<K extends keyof any, T> = {
    [P in K]: T;
  };
  type petsGroup = 'dog' | 'cat';
  interface IPetInfo {
    name:string,
    age:number,
  }

  type IPets = Record<petsGroup, IPetInfo>;
  效果 {
    dog:{
      name:string,
      age:number,
    }
    cat:{
      name:string,
      age:number,
    }
  }
  ```
- ReturnType<T>
  
  函数的返回类型
- Parameters<F>
  
  返回一个函数的所有参数类型
- ConstructorParameters<C>

获取一个类构造函数的参数类型
- Readonly

  看名字你就知道了，变成只读
  ```
  type Readonly<T>
  ```
### 这些工具函数确实在有些时候可以帮助我们少定义类型而且让代码更加灵活，其实这些都来自于2.8加入的关键字
`extend`  `infer`

- extend
  
```
T extends U ? X : Y
//这个的意思是当T继承U时返回X，否则返回Y。你当做js里的?:效果来看就好了
```
- infer
infer只能在`True`分支里用，这个很重要
```
刚刚将的ReturnType的实现
// 内置 ReturnType
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;


```