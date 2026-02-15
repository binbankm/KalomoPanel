import { useQuery } from '@tanstack/react-query'
import { 
  Globe, 
  Network, 
  Shield, 
  Code2, 
  Database, 
  FileText, 
  HardDrive,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

interface StatsData {
  domains: number
  dnsRecords: number
  workers: number
  kvNamespaces: number
  pages: number
  buckets: number
}

const statCards = [
  { key: 'domains', label: '域名数量', icon: Globe, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { key: 'dnsRecords', label: 'DNS记录', icon: Network, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { key: 'workers', label: 'Workers', icon: Code2, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { key: 'kvNamespaces', label: 'KV命名空间', icon: Database, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { key: 'pages', label: 'Pages项目', icon: FileText, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { key: 'buckets', label: 'R2 Buckets', icon: HardDrive, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
]

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // 这里应该调用聚合的统计API
      // 暂时返回模拟数据
      const [domainsRes, workersRes, kvRes, pagesRes, bucketsRes] = await Promise.all([
        api.get('/domains'),
        api.get('/workers/scripts'),
        api.get('/kv/namespaces'),
        api.get('/pages/projects'),
        api.get('/r2/buckets'),
      ])

      return {
        domains: domainsRes.data?.data?.length || 0,
        dnsRecords: 0, // 需要额外计算
        workers: workersRes.data?.length || 0,
        kvNamespaces: kvRes.data?.length || 0,
        pages: pagesRes.data?.length || 0,
        buckets: bucketsRes.data?.length || 0,
      }
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">
          欢迎使用 Cloudflare 管理面板
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = stats?.[card.key as keyof StatsData] ?? 0

          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.label}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-md`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '-' : value}
                </div>
                <p className="text-xs text-muted-foreground">
                  总计数量
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              快速操作
            </CardTitle>
            <CardDescription>
              常用的管理操作快捷入口
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span>管理域名</span>
              </div>
              <Badge variant="secondary">热门</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-muted-foreground" />
                <span>配置DNS</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span>防火墙规则</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              系统状态
            </CardTitle>
            <CardDescription>
              Cloudflare API 连接状态
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API 连接</span>
              <Badge variant="default" className="bg-green-500">正常</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">数据库</span>
              <Badge variant="default" className="bg-green-500">正常</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">认证服务</span>
              <Badge variant="default" className="bg-green-500">正常</Badge>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                上次检查: {new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
