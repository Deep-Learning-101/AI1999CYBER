import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 直接存取 /admin-panel 一律 404（真實路由藏在這，防止掃描）
  if (pathname.startsWith('/admin-panel')) {
    return new NextResponse(null, { status: 404 })
  }

  // 讀取自訂管理路徑（預設 'manage'，上線前請改成難以猜測的字串）
  const adminPath = process.env.ADMIN_PATH || 'manage'

  // URL 吻合時，內部 rewrite 到 /admin-panel，對外 URL 保持不變
  if (pathname === `/${adminPath}` || pathname.startsWith(`/${adminPath}/`)) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.replace(`/${adminPath}`, '/admin-panel')
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // 比對所有頁面路由（排除靜態資源與 API）
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
