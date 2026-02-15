import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Network, Plus, Search, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'
import type { DNSRecord, Domain } from '@/types'

export function DNSPage() {
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.get('/domains')
      return response.data.data
    },
  })

  const { data: records, isLoading, refetch } = useQuery<DNSRecord[]>({
    queryKey: ['dns-records', selectedDomain],
    queryFn: async () => {
      if (!selectedDomain) return []
      const response = await api.get(`/domains/${selectedDomain}/dns`)
      return response.data.data
    },
    enabled: !!selectedDomain,
  })

  const filteredRecords = records?.filter((record: DNSRecord) =>
    record.name.toLowerCase().includes(search.toLowerCase()) ||
    record.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DNS管理</h1>
          <p className="text-muted-foreground">管理域名的 DNS 记录</p>
        </div>
        <Button disabled={!selectedDomain}>
          <Plus className="h-4 w-4 mr-2" />
          添加记录
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DNS记录</CardTitle>
              <CardDescription>选择域名查看和管理 DNS 记录</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="选择域名" />
                </SelectTrigger>
                <SelectContent>
                  {domains?.map((domain: Domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索记录..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={!selectedDomain}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>代理状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedDomain ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    请先选择一个域名
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">加载中...</TableCell>
                </TableRow>
              ) : filteredRecords?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无 DNS 记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords?.map((record: DNSRecord) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.content}</TableCell>
                    <TableCell>{record.ttl}</TableCell>
                    <TableCell>
                      <Badge variant={record.proxied ? 'default' : 'secondary'}>
                        {record.proxied ? '已代理' : '仅 DNS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">编辑</Button>
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
