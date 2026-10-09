import { ApiProperty } from '@nestjs/swagger';
import { ProductSize } from './create-product-size.dto';

export class ProductSizeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  productId: number;

  @ApiProperty({
    enum: ProductSize,
    enumName: 'ProductSize',
    example: ProductSize.PEQUENO,
    description: 'Tamanho do produto.',
  })
  size: ProductSize;

  @ApiProperty({
    example: true,
    description: 'Indica se o tamanho está disponível.',
  })
  available: boolean;
}