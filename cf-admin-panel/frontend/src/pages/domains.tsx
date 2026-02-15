import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe, Plus, Search, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import api from '@/lib/api'
import type { Domain } from '@/types'

export function DomainsPage() {
  const [search, setSearch] = useState('')

  const { data: domains, isLoading, refetch } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.get('/domains')
      return response.data.data
    },
  })

  const filteredDomains = domains?.filter((domain: Domain) =>
    domain.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">域名管理</h1>
          <p className="text-muted-foreground">管理您的 Cloudflare 域名</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加域名
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>域名列表</CardTitle>
              <CardDescription>共 {domains?.length || 0} 个域名</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索域名..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>域名</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">加载中...</TableCell>
                </TableRow>
              ) : filteredDomains?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无域名
                  </TableCell>
                </TableRow>
              ) : (
                filteredDomains?.map((domain: Domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{domain.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.status === 'active' ? 'default' : 'secondary'}>
                        {domain.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{domain.type}</TableCell>
                    <TableCell>{new Date(domain.created_on).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">管理</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
