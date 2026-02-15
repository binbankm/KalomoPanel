import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserCog, Plus, Search, Edit, Trash2, Shield, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import type { Role, Permission } from '@/types'

export function RolesPage() {
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  })

  const { data: roles, isLoading, refetch } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles')
      return response.data
    },
  })

  const { data: permissions } = useQuery<Record<string, Permission[]>>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await api.get('/roles/permissions')
      return response.data
    },
  })

  const filteredRoles = roles?.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateRole = async () => {
    try {
      await api.post('/roles', {
        ...newRole,
        permissionIds: selectedPermissions,
      })
      setNewRole({ name: '', description: '' })
      setSelectedPermissions([])
      setIsCreateOpen(false)
      refetch()
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return
    
    try {
      await api.put(`/roles/${editingRole.id}`, {
        description: editingRole.description,
        permissionIds: selectedPermissions,
      })
      setEditingRole(null)
      setSelectedPermissions([])
      refetch()
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  const handleDeleteRole = async (id: string) => {
    if (!confirm('确定要删除这个角色吗？')) return
    
    try {
      await api.delete(`/roles/${id}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete role:', error)
    }
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setSelectedPermissions(role.permissions.map((p) => p.id))
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const permissionModules = permissions ? Object.keys(permissions) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">角色权限</h1>
          <p className="text-muted-foreground">
            管理用户角色和权限配置
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建角色
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建角色</DialogTitle>
              <DialogDescription>
                创建新角色并分配权限
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>角色名称</Label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="role_name"
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="角色描述"
                />
              </div>
              <div className="space-y-2">
                <Label>权限</Label>
                <div className="space-y-4 border rounded-lg p-4">
                  {permissionModules.map((module) => (
                    <div key={module}>
                      <h4 className="font-medium mb-2 capitalize">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions?.[module].map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={permission.id} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateRole}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            角色列表
          </CardTitle>
          <CardDescription>
            共 {roles?.length || 0} 个角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>权限数量</TableHead>
                  <TableHead>用户数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">加载中...</TableCell>
                  </TableRow>
                ) : filteredRoles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无角色
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell>{role.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.permissions.length} 个权限</Badge>
                      </TableCell>
                      <TableCell>{role.userCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>
              修改角色权限配置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>角色名称</Label>
              <Input value={editingRole?.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={editingRole?.description || ''}
                onChange={(e) =>
                  setEditingRole(editingRole ? { ...editingRole, description: e.target.value } : null)
                }
                placeholder="角色描述"
              />
            </div>
            <div className="space-y-2">
              <Label>权限</Label>
              <div className="space-y-4 border rounded-lg p-4">
                {permissionModules.map((module) => (
                  <div key={module}>
                    <h4 className="font-medium mb-2 capitalize">{module}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions?.[module].map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateRole}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
