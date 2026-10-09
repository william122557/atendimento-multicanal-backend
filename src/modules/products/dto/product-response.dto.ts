import { ApiProperty } from '@nestjs/swagger';
import { ProductSizeResponseDto } from './product-size-response.dto';

export class ProductResponseDto {
  @ApiProperty({ example: 10 })
  id: number;

  @ApiProperty({ example: 'Bolo de Cenoura' })
  name: string;

  @ApiProperty({ example: 'Tradicional' })
  category: string;

  @ApiProperty({ example: true })
  available: boolean;

  @ApiProperty({ example: 1 })
  displayOrder: number;

  @ApiProperty({ example: '2026-10-07T13:04:06.164Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-07T17:20:09.894Z' })
  updatedAt: Date;

  @ApiProperty({
    type: ProductSizeResponseDto,
    isArray: true,
  })
  sizes: ProductSizeResponseDto[];
}