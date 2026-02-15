import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HardDrive, Plus, Trash2, Folder, File, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import api from '@/lib/api'

interface Bucket {
  name: string
  creation_date: string
}

export function R2Page() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  const { data: buckets, isLoading, refetch } = useQuery<Bucket[]>({
    queryKey: ['r2-buckets'],
    queryFn: async () => {
      const response = await api.get('/r2/buckets')
      return response.data
    },
  })

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return
    
    try {
      await api.post('/r2/buckets', { name: newBucketName })
      setNewBucketName('')
      setIsCreateOpen(false)
      refetch()
    } catch (error) {
      console.error('Failed to create bucket:', error)
    }
  }

  const handleDeleteBucket = async (name: string) => {
    if (!confirm(`确定要删除 Bucket "${name}" 吗？其中的所有对象都将被删除。`)) return
    
    try {
      await api.delete(`/r2/buckets/${name}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete bucket:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">R2存储</h1>
          <p className="text-muted-foreground">
            管理 Cloudflare R2 对象存储
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建 Bucket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建 R2 Bucket</DialogTitle>
              <DialogDescription>
                Bucket 名称必须全局唯一，只能包含小写字母、数字和连字符
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="bucket-name"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateBucket}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Bucket 列表
          </CardTitle>
          <CardDescription>
            共 {buckets?.length || 0} 个 Bucket
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : buckets?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无 Bucket
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket 名称</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buckets?.map((bucket) => (
                    <TableRow key={bucket.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          {bucket.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bucket.creation_date
                          ? new Date(bucket.creation_date).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <File className="h-4 w-4 mr-1" />
                          管理文件
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteBucket(bucket.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
