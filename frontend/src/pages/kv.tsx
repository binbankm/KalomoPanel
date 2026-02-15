import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, Plus, Trash2, Edit, Search, Folder, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import api from '@/lib/api'

interface KVNamespace {
  id: string
  title: string
  supports_url_encoding?: boolean
}

export function KVPage() {
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newNamespaceTitle, setNewNamespaceTitle] = useState('')

  const { data: namespaces, isLoading, refetch } = useQuery<KVNamespace[]>({
    queryKey: ['kv-namespaces'],
    queryFn: async () => {
      const response = await api.get('/kv/namespaces')
      return response.data
    },
  })

  const { data: keys, isLoading: keysLoading } = useQuery({
    queryKey: ['kv-keys', selectedNamespace],
    queryFn: async () => {
      if (!selectedNamespace) return []
      const response = await api.get(`/kv/namespaces/${selectedNamespace}/keys`)
      return response.data
    },
    enabled: !!selectedNamespace,
  })

  const handleCreateNamespace = async () => {
    if (!newNamespaceTitle.trim()) return
    
    try {
      await api.post('/kv/namespaces', { title: newNamespaceTitle })
      setNewNamespaceTitle('')
      setIsCreateOpen(false)
      refetch()
    } catch (error) {
      console.error('Failed to create namespace:', error)
    }
  }

  const handleDeleteNamespace = async (id: string) => {
    if (!confirm('确定要删除这个命名空间吗？其中的所有键值对都将被删除。')) return
    
    try {
      await api.delete(`/kv/namespaces/${id}`)
      if (selectedNamespace === id) {
        setSelectedNamespace(null)
      }
      refetch()
    } catch (error) {
      console.error('Failed to delete namespace:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KV存储</h1>
          <p className="text-muted-foreground">
            管理 Cloudflare KV 命名空间和键值对
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建命名空间
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建 KV 命名空间</DialogTitle>
              <DialogDescription>
                输入命名空间的名称
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="命名空间名称"
              value={newNamespaceTitle}
              onChange={(e) => setNewNamespaceTitle(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateNamespace}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Namespaces List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              命名空间
            </CardTitle>
            <CardDescription>
              共 {namespaces?.length || 0} 个命名空间
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : namespaces?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无命名空间
              </div>
            ) : (
              <div className="space-y-2">
                {namespaces?.map((ns) => (
                  <div
                    key={ns.id}
                    onClick={() => setSelectedNamespace(ns.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                      selectedNamespace === ns.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium truncate">{ns.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${selectedNamespace === ns.id ? 'hover:bg-primary-foreground/20' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNamespace(ns.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keys List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              键值对
            </CardTitle>
            <CardDescription>
              {selectedNamespace
                ? `查看命名空间中的键值对`
                : '请选择一个命名空间'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedNamespace ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索键..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加键值对
                  </Button>
                </div>

                {keysLoading ? (
                  <div className="text-center py-8">加载中...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>键名</TableHead>
                          <TableHead>过期时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keys?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              暂无键值对
                            </TableCell>
                          </TableRow>
                        ) : (
                          keys?.map((key: any) => (
                            <TableRow key={key.name}>
                              <TableCell className="font-medium">{key.name}</TableCell>
                              <TableCell>
                                {key.expiration
                                  ? new Date(key.expiration * 1000).toLocaleString('zh-CN')
                                  : '永不过期'}
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
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                请从左侧选择一个命名空间
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
