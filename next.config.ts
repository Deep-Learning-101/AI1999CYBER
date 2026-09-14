import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // 啟用 standalone 輸出以支援 Docker 容器化部署
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

export default nextConfig
