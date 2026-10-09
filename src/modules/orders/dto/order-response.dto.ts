import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDto } from './order-item-response.dto';

export class OrderResponseDto {
  @ApiProperty({
    example: 8,
    description: 'ID do pedido.',
  })
  id: number;

  @ApiProperty({
    enum: ['PENDING', 'PAID', 'CANCELED'],
    example: 'PENDING',
    description: 'Status atual do pedido.',
  })
  status: 'PENDING' | 'PAID' | 'CANCELED';

  @ApiProperty({
    example: '2026-10-05T13:41:24.568',
    description: 'Data de criação do pedido.',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-10-05T13:41:24.566',
    description: 'Data da última atualização do pedido.',
  })
  updatedAt: string;

  @ApiProperty({
    type: OrderItemResponseDto,
    isArray: true,
    description: 'Itens do pedido.',
  })
  items: OrderItemResponseDto[];
}