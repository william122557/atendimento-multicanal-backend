import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({
    example: 12,
    description: 'ID do item do pedido.',
  })
  id: number;

  @ApiProperty({
    example: 8,
    description: 'ID do pedido ao qual o item pertence.',
  })
  orderId: number;

  @ApiProperty({
    example: 3,
    description: 'ID do tamanho do produto.',
  })
  productSizeId: number;

  @ApiProperty({
    example: 2,
    description: 'Quantidade do item no pedido.',
  })
  quantity: number;
}