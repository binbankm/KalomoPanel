import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Plus, Search, RefreshCw, Github } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import api from '@/lib/api'

interface PagesProject {
  id: string
  name: string
  subdomain: string
  domains: string[]
  source: {
    type: string
    config: {
      owner: string
      repo_name: string
      production_branch: string
    }
  }
  latest_deployment: {
    id: string
    short_id: string
    created_on: string
    modified_on: string
    status: string
  } | null
  created_on: string
}

export function PagesPage() {
  const [search, setSearch] = useState('')

  const { data: projects, isLoading, refetch } = useQuery<PagesProject[]>({
    queryKey: ['pages-projects'],
    queryFn: async () => {
      const response = await api.get('/pages/projects')
      return response.data.data
    },
  })

  const filteredProjects = projects?.filter((project: PagesProject) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">管理 Cloudflare Pages 项目</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          创建项目
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>项目列表</CardTitle>
              <CardDescription>共 {projects?.length || 0} 个项目</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索项目..."
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
                <TableHead>项目名称</TableHead>
                <TableHead>源代码</TableHead>
                <TableHead>部署状态</TableHead>
                <TableHead>域名</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">加载中...</TableCell>
                </TableRow>
              ) : filteredProjects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无项目
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects?.map((project: PagesProject) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.source?.config ? (
                        <div className="flex items-center gap-1">
                          <Github className="h-3 w-3" />
                          <span className="text-sm">
                            {project.source.config.owner}/{project.source.config.repo_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.latest_deployment ? (
                        <Badge variant={project.latest_deployment.status === 'success' ? 'default' : 'destructive'}>
                          {project.latest_deployment.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未部署</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{project.subdomain}.pages.dev</span>
                    </TableCell>
                    <TableCell>{new Date(project.created_on).toLocaleDateString('zh-CN')}</TableCell>
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
