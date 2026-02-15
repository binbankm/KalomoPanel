import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { cfRequest, getAccountId } from '../utils/api';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

interface Zone {
  id: string;
  name: string;
  status: string;
}

interface DNSRecordsResponse {
  result?: any[];
  length?: number;
}

// GET /api/dashboard/stats - Get aggregated dashboard statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    logger.info('Fetching dashboard stats', { userId: req.user?.id });

    const accountId = await getAccountId();

    // Fetch all data in parallel for better performance
    const [domainsRes, workersRes, kvRes, pagesRes, bucketsRes] = await Promise.allSettled([
      cfRequest<Zone[]>('/zones', { params: {} }),
      cfRequest<any[]>(`/accounts/${accountId}/workers/scripts`, { params: {} }),
      cfRequest<any[]>(`/accounts/${accountId}/storage/kv/namespaces`, { params: {} }),
      cfRequest<any[]>(`/accounts/${accountId}/pages/projects`, { params: {} }),
      cfRequest<any[]>(`/accounts/${accountId}/r2/buckets`, { params: {} }),
    ]);

    // Safely extract data from settled promises
    const domains = domainsRes.status === 'fulfilled' ? (domainsRes.value || []) : [];
    const workers = workersRes.status === 'fulfilled' ? (workersRes.value || []) : [];
    const kvNamespaces = kvRes.status === 'fulfilled' ? (kvRes.value || []) : [];
    const pages = pagesRes.status === 'fulfilled' ? (pagesRes.value || []) : [];
    const buckets = bucketsRes.status === 'fulfilled' ? (bucketsRes.value || []) : [];

    // Calculate total DNS records across all zones
    let totalDnsRecords = 0;
    if (Array.isArray(domains) && domains.length > 0) {
      const dnsPromises = domains.slice(0, 10).map((domain: Zone) => 
        cfRequest<DNSRecordsResponse>(`/zones/${domain.id}/dns_records`, { params: {} })
          .then((res: DNSRecordsResponse) => Array.isArray(res) ? res.length : (res?.result?.length || 0))
          .catch(() => 0)
      );
      const dnsRecordCounts = await Promise.all(dnsPromises);
      totalDnsRecords = dnsRecordCounts.reduce((sum: number, count: number) => sum + count, 0);
      
      // If there are more than 10 domains, estimate the rest
      if (domains.length > 10) {
        const avgRecordsPerDomain = totalDnsRecords / 10;
        totalDnsRecords += Math.round(avgRecordsPerDomain * (domains.length - 10));
      }
    }

    const stats = {
      domains: Array.isArray(domains) ? domains.length : 0,
      dnsRecords: totalDnsRecords,
      workers: Array.isArray(workers) ? workers.length : 0,
      kvNamespaces: Array.isArray(kvNamespaces) ? kvNamespaces.length : 0,
      pages: Array.isArray(pages) ? pages.length : 0,
      buckets: Array.isArray(buckets) ? buckets.length : 0,
    };

    logger.info('Dashboard stats fetched successfully', { 
      userId: req.user?.id,
      stats,
    });

    res.json(successResponse(stats));
  } catch (error) {
    logger.error('Failed to fetch dashboard stats', error as Error, {
      userId: req.user?.id,
    });
    res.status(500).json(errorResponse('Failed to fetch dashboard statistics'));
  }
});

export { router as dashboardRouter };
