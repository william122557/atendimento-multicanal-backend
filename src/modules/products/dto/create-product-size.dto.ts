import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export enum ProductSize {
  PEQUENO = 'PEQUENO',
  GRANDE = 'GRANDE',
}

export class CreateProductSizeDto {
  @ApiProperty({
    enum: ProductSize,
    enumName: 'ProductSize',
    example: ProductSize.PEQUENO,
    description: 'Tamanho do produto.',
  })
  @IsEnum(ProductSize)
  size: ProductSize;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se o tamanho está disponível.',
  })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}