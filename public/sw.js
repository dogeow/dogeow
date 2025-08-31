// Service Worker for DogeOW PWA
const CACHE_NAME = 'dogeow-v1.0.0'
const urlsToCache = ['/', '/offline', '/480.png', '/80.png', '/favicon.ico']

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache)
    })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// 获取事件 - 网络优先，缓存备用
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果网络请求成功，缓存响应
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // 网络失败时，从缓存获取
        return caches.match(event.request).then(response => {
          if (response) {
            return response
          }
          // 如果缓存中也没有，返回离线页面
          if (event.request.mode === 'navigate') {
            return caches.match('/offline')
          }
        })
      })
  )
})

// 推送通知事件
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || 'DogeOW 有新消息',
      icon: data.icon || '/480.png',
      badge: '/80.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: data.url || '/',
      },
      actions: [
        {
          action: 'open',
          title: '打开',
          icon: '/80.png',
        },
        {
          action: 'close',
          title: '关闭',
          icon: '/80.png',
        },
      ],
    }
    event.waitUntil(self.registration.showNotification(data.title || 'DogeOW', options))
  }
})

// 通知点击事件
self.addEventListener('notificationclick', function (event) {
  console.log('收到通知点击')
  event.notification.close()

  if (event.action === 'open' || event.action === undefined) {
    event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
  }
})

// 后台同步事件
self.addEventListener('sync', function (event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // 在这里实现后台同步逻辑
  console.log('执行后台同步')
  return Promise.resolve()
}
