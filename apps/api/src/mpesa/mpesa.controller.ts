import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MpesaService } from './mpesa.service';

@ApiTags('M-Pesa Callbacks')
@Controller({ path: 'mpesa/callback', version: '1' })
export class MpesaController {
  private readonly logger = new Logger(MpesaController.name);

  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'STK Push callback from Safaricom' })
  async stkCallback(@Body() payload: any) {
    this.logger.log('STK callback received');
    await this.mpesaService.handleSTKCallback(payload);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  @Post('b2c')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'B2C result callback from Safaricom' })
  async b2cCallback(@Body() payload: any) {
    this.logger.log('B2C callback received');
    await this.mpesaService.handleB2CCallback(payload);
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  @Post('b2c/timeout')
  @HttpCode(HttpStatus.OK)
  async b2cTimeout(@Body() payload: any) {
    this.logger.warn('B2C timeout received', JSON.stringify(payload));
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }
}
