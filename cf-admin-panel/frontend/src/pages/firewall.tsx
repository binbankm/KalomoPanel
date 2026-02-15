import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Plus, Trash2, Edit, Ban, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import type { Domain } from '@/types'

const RULE_ACTIONS = [
  { value: 'block', label: '阻止', color: 'bg-red-500' },
  { value: 'challenge', label: 'JS挑战', color: 'bg-yellow-500' },
  { value: 'managed_challenge', label: '托管挑战', color: 'bg-orange-500' },
  { value: 'allow', label: '允许', color: 'bg-green-500' },
  { value: 'log', label: '记录', color: 'bg-blue-500' },
]

export function FirewallPage() {
  const [selectedZone, setSelectedZone] = useState('')
  const [activeTab, setActiveTab] = useState('rules')

  const { data: domains } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.get('/domains')
      return response.data.data
    },
  })

  const { data: firewallRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['firewall-rules', selectedZone],
    queryFn: async () => {
      if (!selectedZone) return []
      const response = await api.get(`/firewall/${selectedZone}/rules`)
      return response.data
    },
    enabled: !!selectedZone && activeTab === 'rules',
  })

  const { data: accessRules, isLoading: accessLoading } = useQuery({
    queryKey: ['access-rules', selectedZone],
    queryFn: async () => {
      if (!selectedZone) return []
      const response = await api.get(`/firewall/${selectedZone}/access-rules`)
      return response.data
    },
    enabled: !!selectedZone && activeTab === 'access',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">防火墙</h1>
        <p className="text-muted-foreground">
          配置防火墙规则和访问控制
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
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

      {selectedZone && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules">防火墙规则</TabsTrigger>
            <TabsTrigger value="access">IP访问规则</TabsTrigger>
            <TabsTrigger value="waf">WAF规则</TabsTrigger>
            <TabsTrigger value="events">安全事件</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">防火墙规则</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建规则
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>描述</TableHead>
                    <TableHead>表达式</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">加载中...</TableCell>
                    </TableRow>
                  ) : firewallRules?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无防火墙规则
                      </TableCell>
                    </TableRow>
                  ) : (
                    firewallRules?.map((rule: any) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.description}</TableCell>
                        <TableCell className="max-w-xs truncate font-mono text-sm">
                          {rule.filter?.expression}
                        </TableCell>
                        <TableCell>
                          <Badge className={RULE_ACTIONS.find(a => a.value === rule.action)?.color}>
                            {RULE_ACTIONS.find(a => a.value === rule.action)?.label || rule.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.paused ? 'secondary' : 'default'}>
                            {rule.paused ? '已暂停' : '活跃'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">IP访问规则</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加IP
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP/范围</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">加载中...</TableCell>
                    </TableRow>
                  ) : accessRules?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        暂无IP访问规则
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessRules?.map((rule: any) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {rule.configuration?.value}
                        </TableCell>
                        <TableCell>
                          <Badge className={RULE_ACTIONS.find(a => a.value === rule.mode)?.color}>
                            {RULE_ACTIONS.find(a => a.value === rule.mode)?.label || rule.mode}
                          </Badge>
                        </TableCell>
                        <TableCell>{rule.notes}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="waf">
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              WAF规则管理功能开发中
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              安全事件查看功能开发中
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!selectedZone && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          请先选择一个域名配置防火墙
        </div>
      )}
    </div>
  )
}
