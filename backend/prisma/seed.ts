import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface PermissionData {
  code: string;
  name: string;
  module: string;
}

async function main() {
  console.log('开始初始化数据库...');

  // 创建权限
  const permissions: PermissionData[] = [
    // 用户管理
    { code: 'user:view', name: '查看用户', module: 'user' },
    { code: 'user:create', name: '创建用户', module: 'user' },
    { code: 'user:update', name: '更新用户', module: 'user' },
    { code: 'user:delete', name: '删除用户', module: 'user' },
    
    // 角色权限管理
    { code: 'role:view', name: '查看角色', module: 'role' },
    { code: 'role:create', name: '创建角色', module: 'role' },
    { code: 'role:update', name: '更新角色', module: 'role' },
    { code: 'role:delete', name: '删除角色', module: 'role' },
    
    // 域名管理
    { code: 'domain:view', name: '查看域名', module: 'domain' },
    { code: 'domain:manage', name: '管理域名', module: 'domain' },
    
    // DNS管理
    { code: 'dns:view', name: '查看DNS', module: 'dns' },
    { code: 'dns:manage', name: '管理DNS', module: 'dns' },
    
    // SSL管理
    { code: 'ssl:view', name: '查看SSL', module: 'ssl' },
    { code: 'ssl:manage', name: '管理SSL', module: 'ssl' },
    
    // 防火墙管理
    { code: 'firewall:view', name: '查看防火墙', module: 'firewall' },
    { code: 'firewall:manage', name: '管理防火墙', module: 'firewall' },
    
    // 分析统计
    { code: 'analytics:view', name: '查看分析', module: 'analytics' },
    
    // Workers管理
    { code: 'workers:view', name: '查看Workers', module: 'workers' },
    { code: 'workers:manage', name: '管理Workers', module: 'workers' },
    
    // KV管理
    { code: 'kv:view', name: '查看KV', module: 'kv' },
    { code: 'kv:manage', name: '管理KV', module: 'kv' },
    
    // Pages管理
    { code: 'pages:view', name: '查看Pages', module: 'pages' },
    { code: 'pages:manage', name: '管理Pages', module: 'pages' },
    
    // R2管理
    { code: 'r2:view', name: '查看R2', module: 'r2' },
    { code: 'r2:manage', name: '管理R2', module: 'r2' },
    
    // 系统设置
    { code: 'settings:view', name: '查看设置', module: 'settings' },
    { code: 'settings:manage', name: '管理系统设置', module: 'settings' },
    
    // 日志查看
    { code: 'logs:view', name: '查看日志', module: 'logs' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log('权限数据创建完成');

  // 获取所有权限ID
  const allPermissions = await prisma.permission.findMany();
  const allPermissionIds = allPermissions.map((p: { id: string }) => ({ id: p.id }));

  // 创建超级管理员角色
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: '超级管理员，拥有所有权限',
    },
  });

  // 创建管理员角色
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '管理员，可管理大部分功能但不能修改系统设置',
    },
  });

  // 创建操作员角色
  const operatorRole = await prisma.role.upsert({
    where: { name: 'operator' },
    update: {},
    create: {
      name: 'operator',
      description: '操作员，可执行日常操作但不能管理用户',
    },
  });

  // 创建只读角色
  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: '只读用户，只能查看数据',
    },
  });

  console.log('角色创建完成');

  // 为超级管理员分配所有权限
  await prisma.role.update({
    where: { id: superAdminRole.id },
    data: {
      permissions: {
        create: allPermissionIds.map((p: { id: string }) => ({
          permission: { connect: p }
        }))
      }
    }
  });

  // 为管理员分配权限（除用户管理和系统设置外）
  const adminPermissionCodes = allPermissions
    .filter((p: { code: string }) => !p.code.startsWith('user:') && !p.code.startsWith('role:') && !p.code.startsWith('settings:manage'))
    .map((p: { id: string }) => p.id);
  
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        create: adminPermissionCodes.map((id: string) => ({
          permission: { connect: { id } }
        }))
      }
    }
  });

  // 为操作员分配操作权限（无删除权限）
  const operatorPermissionCodes = allPermissions
    .filter((p: { code: string }) => !p.code.includes(':delete') && !p.code.startsWith('user:') && !p.code.startsWith('role:') && !p.code.startsWith('settings:'))
    .map((p: { id: string }) => p.id);
  
  await prisma.role.update({
    where: { id: operatorRole.id },
    data: {
      permissions: {
        create: operatorPermissionCodes.map((id: string) => ({
          permission: { connect: { id } }
        }))
      }
    }
  });

  // 为只读用户分配查看权限
  const viewerPermissionCodes = allPermissions
    .filter((p: { code: string }) => p.code.includes(':view'))
    .map((p: { id: string }) => p.id);
  
  await prisma.role.update({
    where: { id: viewerRole.id },
    data: {
      permissions: {
        create: viewerPermissionCodes.map((id: string) => ({
          permission: { connect: { id } }
        }))
      }
    }
  });

  console.log('权限分配完成');

  // 创建默认超级管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '超级管理员',
      roleId: superAdminRole.id,
    },
  });

  console.log('默认管理员用户创建完成');
  console.log('用户名: admin, 密码: admin123');
  console.log('数据库初始化完成！');
}

main()
  .catch((e: Error) => {
    console.error(e);
    (process as NodeJS.Process).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
