import { Module } from '@nestjs/common';
import { NinetyNineFoodController } from './ninety-nine-food.controller';

@Module({
  controllers: [NinetyNineFoodController],
})
export class NinetyNineFoodModule {}
