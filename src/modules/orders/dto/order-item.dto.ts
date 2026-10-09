import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({
    example: 3,
    description: 'ID do tamanho do produto.',
  })
  @IsInt()
  @Min(1)
  productSizeId: number;

  @ApiProperty({
    example: 2,
    description: 'Quantidade desejada do item.',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}