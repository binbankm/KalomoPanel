import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Code2, Plus, Play, Trash2, Edit, FileCode, Route } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'

export function WorkersPage() {
  const [activeTab, setActiveTab] = useState('scripts')
  const [search, setSearch] = useState('')

  const { data: scripts, isLoading: scriptsLoading } = useQuery({
    queryKey: ['workers-scripts'],
    queryFn: async () => {
      const response = await api.get('/workers/scripts')
      return response.data
    },
  })

  const filteredScripts = scripts?.filter((script: any) =>
    script.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">
            管理 Cloudflare Workers 脚本和路由
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          创建 Workers
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scripts">
            <FileCode className="h-4 w-4 mr-2" />
            脚本
          </TabsTrigger>
          <TabsTrigger value="routes">
            <Route className="h-4 w-4 mr-2" />
            路由
          </TabsTrigger>
          <TabsTrigger value="kv">
            <Code2 className="h-4 w-4 mr-2" />
            KV绑定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="搜索脚本..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>脚本名称</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最后修改</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scriptsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">加载中...</TableCell>
                  </TableRow>
                ) : filteredScripts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      暂无 Workers 脚本
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScripts?.map((script: any) => (
                    <TableRow key={script.id}>
                      <TableCell className="font-medium">{script.id}</TableCell>
                      <TableCell>
                        {script.created_on ? new Date(script.created_on).toLocaleDateString('zh-CN') : '-'}
                      </TableCell>
                      <TableCell>
                        {script.modified_on ? new Date(script.modified_on).toLocaleDateString('zh-CN') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
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

        <TabsContent value="routes">
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            Workers 路由管理功能开发中
          </div>
        </TabsContent>

        <TabsContent value="kv">
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            KV 绑定管理功能开发中
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
