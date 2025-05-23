// 강화된 브라우저 저장소 정리 유틸리티

export function forceCleanAuthStorage() {
  if (typeof window === 'undefined') return
  
  console.log('🧹 Starting deep storage cleanup...')
  
  try {
    // localStorage 완전 정리
    const localKeys = Object.keys(localStorage)
    let removedCount = 0
    
    localKeys.forEach(key => {
      if (
        key.includes('supabase') ||
        key.includes('auth') ||
        key.startsWith('sb-') ||
        key.includes('token')
      ) {
        try {
          localStorage.removeItem(key)
          removedCount++
          console.log(`🗑️ Removed localStorage key: ${key}`)
        } catch (error) {
          console.warn(`Failed to remove key: ${key}`, error)
        }
      }
    })
    
    // sessionStorage 정리
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (
        key.includes('supabase') ||
        key.includes('auth') ||
        key.startsWith('sb-')
      ) {
        try {
          sessionStorage.removeItem(key)
          console.log(`🗑️ Removed sessionStorage key: ${key}`)
        } catch (error) {
          console.warn(`Failed to remove session key: ${key}`, error)
        }
      }
    })
    
    // 쿠키 정리
    try {
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('supabase') || name.includes('auth') || name.startsWith('sb-')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          console.log(`🍪 Removed cookie: ${name}`)
        }
      })
    } catch (error) {
      console.warn('Cookie cleanup error:', error)
    }
    
    console.log(`✅ Storage cleanup complete. Removed ${removedCount} localStorage items`)
    
  } catch (error) {
    console.error('🚨 Storage cleanup failed:', error)
  }
}export function clearCorruptedAuthData() {
  forceCleanAuthStorage()
}

export function initializeApp() {
  console.log('🚀 App initialization started')
  forceCleanAuthStorage()
  console.log('✅ App initialization complete')
}

// 개발 환경에서 수동 정리 함수
export function devCleanup() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Development cleanup triggered')
    forceCleanAuthStorage()
    window.location.reload()
  }
}

// 글로벌 윈도우 객체에 추가 (개발용)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devCleanup = devCleanup
  (window as any).forceCleanAuthStorage = forceCleanAuthStorage
}
