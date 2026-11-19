import { Controller, Get } from '@nestjs/common';

@Controller('ninety-nine-food')
export class NinetyNineFoodController {
  @Get('health')
  health() {
    return {
      provider: '99food',
      moduleReady: true,
      credentialsValidated: false,
      webhookReady: false,
      synchronizationEnabled: false,
    };
  }
}
