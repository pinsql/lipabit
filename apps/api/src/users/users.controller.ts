import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.updateProfile(userId, body);
  }

  @Post('kyc')
  @ApiOperation({ summary: 'Submit KYC documents' })
  submitKyc(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.submitKyc(userId, body);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get my Bitcoin wallet' })
  getWallet(@CurrentUser('id') userId: string) {
    return this.usersService.getWallet(userId);
  }
}
