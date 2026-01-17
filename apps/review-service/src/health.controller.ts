import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
	@Get()
	@ApiOperation({ summary: 'Service health check' })
	@ApiResponse({ status: 200, description: 'Service is healthy.' })
	health() {
		return {
			status: 'ok',
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		};
	}
}
