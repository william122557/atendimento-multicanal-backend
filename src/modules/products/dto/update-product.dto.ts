import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
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
    example: 'Bolo de Cenoura',
    description: 'Nome do produto.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Tradicional',
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
    description:
      'Lista completa dos tamanhos que o produto deverá manter. ' +
      'Tamanhos existentes preservam seus IDs. ' +
      'Se o campo for omitido, os tamanhos não serão alterados.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: CreateProductSizeDto) => item.size, {
    message: 'Não é permitido repetir tamanhos no mesmo produto.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDto)
  sizes?: CreateProductSizeDto[];
}