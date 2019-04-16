var cacheStorageKey = "pwa-demo01-v1"; //版本号，当想更新缓存资源（文件、数据等）
var cacheList = ["./", "./index.html", "./main.css", "./logo072.png"]; //列出了所有的静态资源依赖，需要缓存的文件路径
//当脚本加载完毕执行
//self是Service Worker中一个特殊的全局变量，类似于我们最常见的window对象。self引用了当前这个Service Worker。
//首先要监听install事件，安装完成后，进行文件缓存
//我们就会通过caches.open()与cache.addAll()方法将资源缓存起来。这里我们给缓存起了一个cacheStorageKey，这个值会成为这些缓存的key。
self.addEventListener("install", function(e) {
  e.waitUntil(
    //创建缓存并缓存cacheList的所以文件
    //caches是一个全局变量，通过它我们可以操作Cache相关接口。
    //Cache 接口提供缓存的 Request / Response 对象对的存储机制。Cache 接口像 workers 一样, 是暴露在 window 作用域下的。
    //尽管它被定义在 service worker 的标准中,  但是它不必一定要配合 service worker 使用
    caches
      .open(cacheStorageKey)
      .then(function(cache) {
        //这是需要我们有一个本地的cache，可以灵活地将各类资源进行本地存取。
        return cache.addAll(cacheList);
      })
      .then(function() {
        //使用了一个方法那就是 self.skipWaiting( ) ，为了在页面更新的过程当中，新的 SW 脚本能够立刻激活和生效
        return self.skipWaiting();
      })
  );
});
//若不存在cache，则通过fetch方法向服务端发起请求，并返回请求结果给浏览器,fetch事件会监听所有浏览器的请求
self.addEventListener("fetch", function(e) {
  //fetch事件会监听所有浏览器的请求。e.respondWith()方法接受Promise作为参数，
  //通过它让Service Worker向浏览器返回数据。caches.match(e.request)则可以查看当前的请求是否有一份本地缓存：
  //如果有缓存，则直接向浏览器返回cache；否则Service Worker会向后端服务发起一个fetch(e.request)的请求，并将请求结果返回给浏览器。
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response != null) {
        return response;
      }
      // 因为 event.request 流已经在 caches.match 中使用过一次，
      // 那么该流是不能再次使用的。我们只能得到它的副本，拿去使用。
      var fetchRequest = e.request.clone();
      return fetch(fetchRequest).then(function(res) {
        // 检查是否成功
        //失败了
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        // 如果成功，该 response 一是要拿给浏览器渲染，二是要进行缓存。
        // 不过需要记住，由于 caches.put 使用的是文件的响应流，一旦使用，
        // 那么返回的 response 就无法访问造成失败，所以，这里需要复制一份。
        var responseToCache = res.clone();
        caches.open(cacheStorageKey).then(function(cache) {
          cache.put(e.request, responseToCache);
        });
        return res;
      });
    })
  );
});
//当被激活时，检查版本资源，移除旧版本的资源
//更新静态缓存资源
self.addEventListener("activate", function(e) {
  e.waitUntil(
    //获取所有cache名称
    caches
      .keys()
      .then(function(cacheNames) {
        return Promise.all(
          //移除不是该版本的所有资源
          cacheNames
            .filter(function(cacheName) {
              return cacheName !== cacheStorageKey;
            })
            .map(function(cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function() {
        return self.clients.claim(); //在新安装的 SW 中通过调用 self.clients.claim( ) 取得页面的控制权，这样之后打开页面都会使用版本更新的缓存。
      })
  );
});
