---

title: 总结http缓存机制

meta:
  - name: description
    content: 总结http缓存机制
  - name: keywords
    content: http ,缓存 

created: 2020/09/23

updated: 2020/09/23
 
tags:
  - http
  - 缓存

---
# 总结http缓存机制

http缓存在web性能优化中起了很大的作用，而http相关的文档讲述并不清晰，而且相当的杂乱，我在阅读多篇文章(文章文末标出)以及查看过[MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)之后做了一点整理和总结。

总的来说http有如下几种实现方式 `Pragma` `Expires` `Cache-Control` `Last-Modified` `ETag` ，缓存方式又分为`强缓存` `协商缓存` 。

### 强缓存

直接访问本地通过 `Pragma` `Expires` `Cache-Control` 来判断有没有缓存，缓存有没有过期，如果没过期那么直接从本地取，服务器返回code `200 from cache`如果本地不能得到那么就访问远程。

### 协商缓存

协商缓存通过 `Last-Modified` `ETag` 来使用，客户端发送请求给后端验证缓存是否过期，服务器返回`304 Not Modified` 属于协商缓存，则调用本地缓存。

### pragma

这是一种比较古老的请求头，只建议在向下兼容http1.0的时候使用，当值为`Pragma:no-cache`，效果和`Cache-Control:no-cache`一样。

### Expires

`Expires`也是兼容http1.0的一项请求头。

通过服务端设置，给`Response Headers`添加一个GMT（格林尼治时间）作为`Expires`的响应头，客户端在发请求前，判断`Expires`的时间是否已经过期来决定是否向服务端发送请求。

### Cache-Control

#### 请求头

```
//告诉服务端，愿意接收一个请求时间为seconds秒的资源
Cache-Control: max-age=<seconds>
//告诉服务端，愿意接收一个超出缓存时间seconds秒的资源，如果未定义，则允许超出任意时间
Cache-Control: max-stale[=<seconds>]
//告诉服务端，希望接收一个seconds秒内被更新过的资源
Cache-Control: min-fresh=<seconds>
//告诉服务端，不直接使用缓存，跳过强缓存的步骤
Cache-control: no-cache
//告诉服务端，所有内容都不被缓存到浏览器中
Cache-control: no-store
//告诉服务端，希望获取实体数据没有被转换过（如压缩）的资源
Cache-control: no-transform
//告诉服务端，希望获取缓存的内容（若有）
Cache-control: only-if-cached
```

#### 响应头

```
//缓存必须在使用之前验证旧资源的状态，并且不可使用过期资源
Cache-control: must-revalidate
//不直接使用缓存，跳过强缓存的步骤
Cache-control: no-cache
//所有内容都不被缓存到浏览器中
Cache-control: no-store
//不得对资源进行转换或转变。Content-Encoding, Content-Range, Content-Type等HTTP头不能由代理修改。例如，非透明代理可以对图像格式进行转换，以便节省缓存空间或者减少缓慢链路上的流量
Cache-control: no-transform
//表明响应可以被任何对象（包括：发送请求的客户端，代理服务器，等等）缓存
Cache-control: public
//表明响应只能被单个用户缓存，不能作为共享缓存（即代理服务器不能缓存它）,可以缓存响应内容
Cache-control: private
//与must-revalidate作用相同，但它仅适用于共享缓存（例如代理），并被私有缓存忽略
Cache-control: proxy-revalidate
//设置缓存存储的最大周期，超过这个时间缓存被认为过期(单位秒)。与Expires相反，时间是相对于请求的时间
Cache-Control: max-age=<seconds>
//覆盖max-age 或者 Expires 头，但是仅适用于共享缓存(比如各个代理)，并且私有缓存中它被忽略
Cache-control: s-maxage=<seconds>
```



### Last-Modified

第一次请求资源时，会将资源最后更改的时间以`Last-Modified: GMT`的形式加在实体首部上一起返回给客户端，当再一次发起请求时，客户端会带上返回的GMT，赋值给`If-Modified-Since`，若服务端判断时间没有更改，则返回`304 NOT MODIFIED`,那么便从本地缓存中取出值

### ETag

服务端在第一次请求资源时，会在响应头`ETag`上添加一个由某种算符得出的随机字符串，当客户端再一次请求该项资源时，会将之前缓存的字符串，自动带上给`If-None-Match`，服务端将得到的字符和服务器中的进行对比。如果不同，则重新抓取文件，若相同，则返回`304`。

### 总结

强缓存中`Pragma` `Expires`都是为了兼容老版本的http协议，而新版本中的`Cache-Control`组合更丰富，也更加强大。而弱缓存中`Last-Modified`中资源的任何变化都会更改时间，可能会重复加载完全一样的文件。`ETag`加载计算可能浪费性能。总的来说协商缓存需要后端返回是否取本地缓存，而强缓存是只要客户端有且未过期那么就取。

## 参考

链接：https://juejin.im/post/6844904047523135496

链接：https://juejin.im/post/6847902216200650760

链接：https://developer.mozilla.org/zh-CN/docs/Web/HTTP
