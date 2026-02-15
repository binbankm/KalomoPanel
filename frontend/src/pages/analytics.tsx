import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Shield, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import type { Domain } from '@/types'

export function AnalyticsPage() {
  const [selectedZone, setSelectedZone] = useState('')
  const [timeRange, setTimeRange] = useState('24h')

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.get('/domains')
      return response.data.data
    },
  })

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', selectedZone, timeRange],
    queryFn: async () => {
      if (!selectedZone) return null
      const response = await api.get(`/analytics/${selectedZone}?since=${timeRange}`)
      return response.data
    },
    enabled: !!selectedZone,
  })

  const stats = [
    { label: '总请求数', value: '1.2M', icon: Zap, change: '+12%' },
    { label: '唯一访客', value: '45.2K', icon: Users, change: '+8%' },
    { label: '缓存命中率', value: '85%', icon: TrendingUp, change: '+3%' },
    { label: '阻止威胁', value: '1.5K', icon: Shield, change: '-5%' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分析统计</h1>
          <p className="text-muted-foreground">
            查看网站流量和安全分析
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="选择域名" />
          </SelectTrigger>
          <SelectContent>
            {domains?.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">最近1小时</SelectItem>
            <SelectItem value="6h">最近6小时</SelectItem>
            <SelectItem value="24h">最近24小时</SelectItem>
            <SelectItem value="7d">最近7天</SelectItem>
            <SelectItem value="30d">最近30天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedZone ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change} 较上期
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Tabs defaultValue="traffic">
            <TabsList>
              <TabsTrigger value="traffic">流量分析</TabsTrigger>
              <TabsTrigger value="security">安全分析</TabsTrigger>
              <TabsTrigger value="performance">性能分析</TabsTrigger>
              <TabsTrigger value="bots">Bot分析</TabsTrigger>
            </TabsList>

            <TabsContent value="traffic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>请求趋势</CardTitle>
                  <CardDescription>过去24小时的请求量变化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    图表组件待实现
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>安全威胁</CardTitle>
                  <CardDescription>检测到的安全威胁统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    图表组件待实现
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>性能指标</CardTitle>
                  <CardDescription>响应时间和缓存命中率</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    图表组件待实现
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bots">
              <Card>
                <CardHeader>
                  <CardTitle>Bot流量</CardTitle>
                  <CardDescription>Bot和爬虫访问统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    图表组件待实现
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          请先选择一个域名查看分析数据
        </div>
      )}
    </div>
  )
}
