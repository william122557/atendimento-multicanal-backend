import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductSizeDto } from './dto/update-product-size.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos' })
  @ApiOkResponse({
    description: 'Lista de produtos retornada com sucesso.',
    type: ProductResponseDto,
    isArray: true,
  })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do produto' })
  @ApiOkResponse({
    description: 'Produto retornado com sucesso.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'ID inválido.' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um novo produto' })
  @ApiCreatedResponse({
    description: 'Produto criado com sucesso.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  create(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um produto' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do produto' })
  @ApiOkResponse({
    description: 'Produto atualizado com sucesso.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'ID inválido ou dados inválidos.' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProductDto,
  ) {
    return this.productsService.update(id, data);
  }

  @Patch(':productId/sizes/:sizeId')
  @ApiOperation({ summary: 'Atualiza a disponibilidade de um tamanho do produto' })
  @ApiParam({ name: 'productId', type: Number, description: 'ID do produto' })
  @ApiParam({ name: 'sizeId', type: Number, description: 'ID do tamanho do produto' })
  @ApiOkResponse({
    description: 'Tamanho do produto atualizado com sucesso.',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'IDs inválidos ou dados inválidos.' })
  @ApiNotFoundResponse({ description: 'Produto ou tamanho não encontrado.' })
  updateSize(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('sizeId', ParseIntPipe) sizeId: number,
    @Body() data: UpdateProductSizeDto,
  ) {
    return this.productsService.updateSize(productId, sizeId, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um produto' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do produto' })
  @ApiNoContentResponse({ description: 'Produto removido com sucesso.' })
  @ApiBadRequestResponse({ description: 'ID inválido.' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
  }
}