import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: OrderItemDto,
    isArray: true,
    example: [
      { productSizeId: 3, quantity: 2 },
      { productSizeId: 9, quantity: 1 },
    ],
    description: 'Lista de itens do pedido.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}