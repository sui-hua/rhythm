import { Controller, Get } from '@nestjs/common';

type HealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
};

// 健康检查端点：GET /api/health，用于部署探活与前后端连通性验证
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'rhythm-api',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }
}
