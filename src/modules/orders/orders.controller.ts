import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os pedidos' })
  @ApiOkResponse({
    description: 'Lista de pedidos retornada com sucesso.',
    type: [OrderResponseDto],
  })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pedido por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiOkResponse({
    description: 'Pedido encontrado com sucesso.',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'ID inválido.' })
  @ApiNotFoundResponse({ description: 'Pedido não encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um novo pedido' })
  @ApiCreatedResponse({
    description: 'Pedido criado com sucesso.',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'productSizeId inválido ou indisponível.',
  })
  @ApiConflictResponse({
    description: 'Há itens duplicados no pedido.',
  })
  create(@Body() data: CreateOrderDto) {
    return this.ordersService.create(data);
  }
}