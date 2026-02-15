import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, Shield, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import type { Domain } from '@/types'

const SSL_MODES = [
  { value: 'off', label: '关闭 (不安全)', description: '不使用HTTPS' },
  { value: 'flexible', label: '灵活', description: '用户到Cloudflare使用HTTPS，Cloudflare到源站使用HTTP' },
  { value: 'full', label: '完全', description: '端到端HTTPS，不验证源站证书' },
  { value: 'full_strict', label: '完全（严格）', description: '端到端HTTPS，验证源站证书' },
]

export function SSLPage() {
  const [selectedZone, setSelectedZone] = useState('')

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.get('/domains')
      return response.data.data
    },
  })

  const { data: sslSettings, isLoading } = useQuery({
    queryKey: ['ssl-settings', selectedZone],
    queryFn: async () => {
      if (!selectedZone) return null
      const response = await api.get(`/ssl/${selectedZone}/settings`)
      return response.data
    },
    enabled: !!selectedZone,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SSL/TLS</h1>
        <p className="text-muted-foreground">
          配置 SSL/TLS 加密设置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            选择域名
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedZone && sslSettings && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSL/TLS 加密模式
              </CardTitle>
              <CardDescription>
                选择适合您网站的加密级别
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SSL_MODES.map((mode) => (
                <div
                  key={mode.value}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    sslSettings.ssl?.value === mode.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{mode.label}</p>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                    {sslSettings.ssl?.value === mode.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>其他设置</CardTitle>
              <CardDescription>
                额外的 SSL/TLS 安全选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>始终使用 HTTPS</Label>
                  <p className="text-sm text-muted-foreground">
                    将所有 HTTP 请求重定向到 HTTPS
                  </p>
                </div>
                <Switch checked={sslSettings.alwaysUseHttps?.value === 'on'} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动 HTTPS 重写</Label>
                  <p className="text-sm text-muted-foreground">
                    自动重写页面中的 HTTP 链接为 HTTPS
                  </p>
                </div>
                <Switch checked={sslSettings.automaticHttpsRewrites?.value === 'on'} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>TLS 1.3</Label>
                  <p className="text-sm text-muted-foreground">
                    启用最新的 TLS 1.3 协议
                  </p>
                </div>
                <Switch checked={sslSettings.tls13?.value === 'on'} />
              </div>

              <div className="pt-4 border-t">
                <Label className="mb-2 block">最低 TLS 版本</Label>
                <Select defaultValue={sslSettings.minTlsVersion?.value || '1.0'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.0">TLS 1.0</SelectItem>
                    <SelectItem value="1.1">TLS 1.1</SelectItem>
                    <SelectItem value="1.2">TLS 1.2</SelectItem>
                    <SelectItem value="1.3">TLS 1.3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedZone && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          请先选择一个域名查看 SSL/TLS 设置
        </div>
      )}
    </div>
  )
}
