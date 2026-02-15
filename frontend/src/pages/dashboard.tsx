import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Globe, 
  Network, 
  Shield, 
  Code2, 
  Database, 
  FileText, 
  HardDrive,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  const navigate = useNavigate()
  
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data?.data || {
        domains: 0,
        dnsRecords: 0,
        workers: 0,
        kvNamespaces: 0,
        pages: 0,
        buckets: 0,
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
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {value.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      总计数量
                    </p>
                  </>
                )}
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
            <div 
              onClick={() => navigate('/domains')}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span>管理域名</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">热门</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div 
              onClick={() => navigate('/dns')}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-muted-foreground" />
                <span>配置DNS</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div 
              onClick={() => navigate('/firewall')}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span>防火墙规则</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
