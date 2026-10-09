import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido com id ${id} não foi encontrado.`);
    }

    return order;
  }

  async create(data: CreateOrderDto) {
    const duplicatedIds = data.items
      .map((item) => item.productSizeId)
      .filter((id, index, arr) => arr.indexOf(id) !== index);

    if (duplicatedIds.length > 0) {
      throw new ConflictException(
        `Itens duplicados no pedido: ${duplicatedIds.join(', ')}.`,
      );
    }

    const productSizes = await this.prisma.productSize.findMany({
      where: {
        id: {
          in: data.items.map((item) => item.productSizeId),
        },
      },
    });

    for (const item of data.items) {
      const productSize = productSizes.find((size) => size.id === item.productSizeId);

      if (!productSize) {
        throw new BadRequestException(
          `productSizeId ${item.productSizeId} é inválido.`,
        );
      }

      if (!productSize.available) {
        throw new BadRequestException(
          `productSizeId ${item.productSizeId} está indisponível.`,
        );
      }
    }

    const createdOrder = await this.prisma.order.create({
      data: {
        items: {
          create: data.items.map((item) => ({
            productSizeId: item.productSizeId,
            quantity: item.quantity,
          })),
        },
      },
    });

    return this.findOne(createdOrder.id);
  }
}