export interface User {
  id: string
  username: string
  email: string
  name: string | null
  avatar: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastLoginAt: string | null
  role: {
    id: string
    name: string
  }
  permissions: string[]
}

export interface Role {
  id: string
  name: string
  description: string | null
  permissions: Permission[]
  userCount?: number
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  module: string
  createdAt: string
}

export interface Domain {
  id: string
  name: string
  status: string
  paused: boolean
  type: string
  development_mode: number
  name_servers: string[]
  original_name_servers: string[]
  created_on: string
  modified_on: string
  activated_on: string | null
  meta: {
    step: number
    custom_certificate_quota: number
    page_rule_quota: number
    phishing_detected: boolean
    multiple_railguns_allowed: boolean
  }
  owner: {
    id: string
    type: string
    email: string
  }
  account: {
    id: string
    name: string
  }
  permissions: string[]
  plan: {
    id: string
    name: string
    price: number
    currency: string
    frequency: string
    is_subscribed: boolean
    can_subscribe: boolean
    legacy_id: string
    legacy_discount: boolean
    externally_managed: boolean
  }
}

export interface DNSRecord {
  id: string
  type: string
  name: string
  content: string
  proxiable: boolean
  proxied: boolean
  ttl: number
  locked: boolean
  zone_id: string
  zone_name: string
  created_on: string
  modified_on: string
  data: Record<string, any> | null
  meta: {
    auto_added: boolean
    managed_by_apps: boolean
    managed_by_argo_tunnel: boolean
    source: string
  }
  priority?: number
  comment?: string
  tags?: string[]
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: Pagination
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
