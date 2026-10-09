import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProductSizeDto {
  @ApiProperty({
    example: false,
    description: 'Indica se o tamanho do produto está disponível.',
  })
  @IsBoolean()
  available: boolean;
}