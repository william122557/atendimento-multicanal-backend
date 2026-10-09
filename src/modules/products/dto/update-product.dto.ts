import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateProductSizeDto } from './create-product-size.dto';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'X-Burger',
    description: 'Nome do produto.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Lanches',
    description: 'Categoria do produto.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se o produto está disponível.',
  })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: 'Ordem de exibição do produto.',
  })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({
    type: CreateProductSizeDto,
    isArray: true,
    example: [
      { size: 'PEQUENO', available: true },
      { size: 'GRANDE', available: false },
    ],
    description: 'Lista de tamanhos do produto.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDto)
  sizes?: CreateProductSizeDto[];
}