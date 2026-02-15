import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Shield, Server, Cloud, Key, Save, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [authType, setAuthType] = useState<'token' | 'global'>('token')
  const [cfApiToken, setCfApiToken] = useState('')
  const [cfGlobalKey, setCfGlobalKey] = useState('')
  const [cfEmail, setCfEmail] = useState('')
  const [cfAccountId, setCfAccountId] = useState('')
  const queryClient = useQueryClient()

  const { data: systemInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      const response = await api.get('/settings/system/info')
      return response.data
    },
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings')
      return response.data.data
    },
  })

  useEffect(() => {
    if (settings) {
      setAuthType(settings.cf_auth_type || 'token')
      setCfApiToken(settings.cf_api_token || '')
      setCfGlobalKey(settings.cf_global_key || '')
      setCfEmail(settings.cf_email || '')
      setCfAccountId(settings.cf_account_id || '')
    }
  }, [settings])

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { 
      cf_auth_type: string
      cf_api_token: string
      cf_global_key: string
      cf_email: string
      cf_account_id: string 
    }) => {
      const response = await api.put('/settings', {
        settings: [
          { key: 'cf_auth_type', value: data.cf_auth_type },
          { key: 'cf_api_token', value: data.cf_api_token },
          { key: 'cf_global_key', value: data.cf_global_key },
          { key: 'cf_email', value: data.cf_email },
          { key: 'cf_account_id', value: data.cf_account_id },
        ]
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('设置保存成功')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: () => {
      toast.error('保存失败')
    }
  })

  const handleSaveCloudflare = () => {
    saveSettingsMutation.mutate({
      cf_auth_type: authType,
      cf_api_token: cfApiToken,
      cf_global_key: cfGlobalKey,
      cf_email: cfEmail,
      cf_account_id: cfAccountId,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">
          配置系统参数和选项
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            常规
          </TabsTrigger>
          <TabsTrigger value="cloudflare">
            <Cloud className="h-4 w-4 mr-2" />
            Cloudflare
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            安全
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            系统
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>常规设置</CardTitle>
              <CardDescription>
                配置面板的基本选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许用户注册</Label>
                  <p className="text-sm text-muted-foreground">
                    开启后新用户可以自行注册账号
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>记录操作日志</Label>
                  <p className="text-sm text-muted-foreground">
                    记录所有用户的操作行为
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloudflare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare API 配置</CardTitle>
              <CardDescription>
                配置 Cloudflare API 访问凭证以管理您的域名和服务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  支持两种认证方式：API Token（推荐，更安全）或 Global API Key（传统方式）。
                  可以在 Cloudflare 控制面板的 "My Profile" 中获取。
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label>认证方式</Label>
                <RadioGroup value={authType} onValueChange={(v) => setAuthType(v as 'token' | 'global')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="token" id="token" />
                    <Label htmlFor="token" className="cursor-pointer">
                      API Token（推荐）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="global" id="global" />
                    <Label htmlFor="global" className="cursor-pointer">
                      Global API Key
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {authType === 'token' ? (
                <div className="space-y-2">
                  <Label htmlFor="cf-api-token">API Token</Label>
                  <Input
                    id="cf-api-token"
                    type="password"
                    placeholder="输入您的 Cloudflare API Token"
                    value={cfApiToken}
                    onChange={(e) => setCfApiToken(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    在 Cloudflare 控制面板 → My Profile → API Tokens → Create Token
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cf-email">注册邮箱</Label>
                    <Input
                      id="cf-email"
                      type="email"
                      placeholder="输入您的 Cloudflare 注册邮箱"
                      value={cfEmail}
                      onChange={(e) => setCfEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cf-global-key">Global API Key</Label>
                    <Input
                      id="cf-global-key"
                      type="password"
                      placeholder="输入您的 Global API Key"
                      value={cfGlobalKey}
                      onChange={(e) => setCfGlobalKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      在 Cloudflare 控制面板 → My Profile → API Tokens → Global API Key → View
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="cf-account-id">Account ID（可选）</Label>
                <Input
                  id="cf-account-id"
                  placeholder="输入您的 Cloudflare Account ID"
                  value={cfAccountId}
                  onChange={(e) => setCfAccountId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  在 Cloudflare 控制面板右侧可以找到，用于 Workers、Pages 等服务
                </p>
              </div>

              <Button 
                onClick={handleSaveCloudflare}
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? '保存中...' : '保存配置'}
              </Button>
            </CardContent>
          </Card>

          {authType === 'token' && (
            <Card>
              <CardHeader>
                <CardTitle>API Token 权限说明</CardTitle>
                <CardDescription>
                  创建 API Token 时需要包含以下权限
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>Zone:Read</strong> - 读取域名信息</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>Zone:Edit</strong> - 编辑域名设置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>DNS:Read, DNS:Edit</strong> - 管理 DNS 记录</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>Workers Scripts:Edit</strong> - 管理 Workers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>Page Rules:Edit</strong> - 管理页面规则</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>SSL:Edit</strong> - 管理 SSL/TLS 设置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span><strong>WAF:Edit</strong> - 管理防火墙规则</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>
                配置安全相关选项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>登录失败锁定次数</Label>
                <Input type="number" defaultValue={5} />
                <p className="text-sm text-muted-foreground">
                  连续登录失败达到此次数后锁定账号
                </p>
              </div>
              <div className="space-y-2">
                <Label>Token 过期时间（天）</Label>
                <Input type="number" defaultValue={7} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统信息</CardTitle>
              <CardDescription>
                查看系统运行状态
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">版本</Label>
                  <p className="font-medium">{systemInfo?.version || '1.0.0'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Node.js 版本</Label>
                  <p className="font-medium">{systemInfo?.nodeVersion || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">运行环境</Label>
                  <p className="font-medium">{systemInfo?.env || 'development'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">运行时间</Label>
                  <p className="font-medium">
                    {systemInfo?.uptime
                      ? `${Math.floor(systemInfo.uptime / 3600)} 小时`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
