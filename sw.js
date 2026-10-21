/* Nice的罐罐食堂 · Service Worker
   作用：把页面外壳缓存到本地，让「添加到主屏幕」后能离线打开、秒开。
   只缓存静态资源；数据本身存在 localStorage，与本文件无关。 */
const CACHE = 'catcan-v22'
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return

  // 页面导航：网络优先，断网时回退到缓存（离线也能打开）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put('./index.html', copy))
        return res
      }).catch(() => caches.match('./index.html'))
    )
    return
  }

  // 其它静态资源：缓存优先，命中后回源更新
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(req, copy))
        }
        return res
      }).catch(() => hit)
    })
  )
})
