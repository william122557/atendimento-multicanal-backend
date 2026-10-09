import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProductSizeDto } from './create-product-size.dto';

export class CreateProductDto {
  @ApiProperty({
    example: 'Bolo de Cenoura',
    description: 'Nome do produto.',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Tradicional',
    description: 'Categoria do produto.',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
  example: true,
  description: 'Indica se o produto está disponível.',
})
@IsOptional()
@IsBoolean()
available?: boolean;
  @IsInt()
  displayOrder?: number;

  @ApiProperty({
    type: CreateProductSizeDto,
    isArray: true,
    example: [
      { size: 'PEQUENO', available: true },
      { size: 'GRANDE', available: true },
    ],
    description: 'Lista de tamanhos do produto.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: CreateProductSizeDto) => item.size, {
    message: 'Não é permitido repetir tamanhos no mesmo produto.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDto)
  sizes: CreateProductSizeDto[];
}