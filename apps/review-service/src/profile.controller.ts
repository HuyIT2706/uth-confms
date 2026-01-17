import { Controller, Get, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
	@Get()
	@ApiOperation({ summary: 'Get profile from access token' })
	@ApiResponse({ status: 200, description: 'Profile/claims from token or userinfo response.' })
	@ApiResponse({ status: 401, description: 'Missing or invalid Authorization header.' })
	async getProfile(@Req() req: Request) {
		const auth = (req.headers['authorization'] as string) || (req.headers['Authorization'] as unknown as string);
		if (!auth) throw new UnauthorizedException('Missing Authorization header');

		const userinfoUrl = process.env.AUTH_USERINFO_URL;
		if (userinfoUrl) {
			const res = await fetch(userinfoUrl, { headers: { Authorization: auth } });
			if (!res.ok) throw new UnauthorizedException('Token not valid according to userinfo endpoint');
			return await res.json();
		}

		const token = auth.split(' ')[1] ?? auth;
		try {
			const parts = token.split('.');
			if (parts.length < 2) throw new Error('Invalid token format');
			const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
			return { tokenValid: true, payload };
		} catch {
			throw new BadRequestException('Cannot validate token; set AUTH_USERINFO_URL or provide a JWT');
		}
	}
}
