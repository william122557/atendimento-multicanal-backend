import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductSizeDto } from './dto/update-product-size.dto';
import {
  CreateProductSizeDto,
  ProductSize,
} from './dto/create-product-size.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: {
        sizes: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sizes: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  create(data: CreateProductDto) {
    this.validateSizes(data.sizes);

    return this.prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        available: data.available ?? true,
        displayOrder: data.displayOrder ?? 0,
        sizes: {
          create: data.sizes.map((size) => ({
            size: size.size,
            available: size.available ?? true,
          })),
        },
      },
      include: {
        sizes: true,
      },
    });
  }

  async update(id: number, data: UpdateProductDto) {
    const { sizes, ...productData } = data;

    if (sizes !== undefined) {
      this.validateSizes(sizes);
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: {
          sizes: true,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      if (sizes !== undefined) {
        const requestedSizes = new Set(
          sizes.map((size) => String(size.size)),
        );

        const sizesToRemove = product.sizes.filter(
          (size) => !requestedSizes.has(String(size.size)),
        );

        const idsToRemove = sizesToRemove.map(
          (size) => size.id,
        );

        if (idsToRemove.length > 0) {
          const relatedOrderItems = await tx.orderItem.count({
            where: {
              productSizeId: {
                in: idsToRemove,
              },
            },
          });

          if (relatedOrderItems > 0) {
            throw new ConflictException(
              'Não é possível remover um tamanho usado em pedidos. ' +
              'Mantenha esse tamanho cadastrado e desative sua disponibilidade.',
            );
          }

          await tx.productSize.deleteMany({
            where: {
              productId: id,
              id: {
                in: idsToRemove,
              },
            },
          });
        }

        for (const size of sizes) {
          await tx.productSize.upsert({
            where: {
              productId_size: {
                productId: id,
                size: size.size,
              },
            },
            update:
              size.available === undefined
                ? {}
                : {
                    available: size.available,
                  },
            create: {
              productId: id,
              size: size.size,
              available: size.available ?? true,
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          sizes: true,
        },
      });
    });
  }

  async updateSize(
    productId: number,
    sizeId: number,
    data: UpdateProductSizeDto,
  ) {
    if (typeof data.available !== 'boolean') {
      throw new BadRequestException(
        'Informe available como true ou false.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        throw new NotFoundException(
          'Produto não encontrado.',
        );
      }

      const productSize = await tx.productSize.findFirst({
        where: {
          id: sizeId,
          productId,
        },
      });

      if (!productSize) {
        throw new NotFoundException(
          'Tamanho do produto não encontrado.',
        );
      }

      await tx.productSize.update({
        where: {
          id: sizeId,
        },
        data: {
          available: data.available,
        },
      });

      return tx.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          sizes: true,
        },
      });
    });
  }

  async remove(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: {
          sizes: true,
        },
      });

      if (!product) {
        throw new NotFoundException(
          'Produto não encontrado.',
        );
      }

      const sizeIds = product.sizes.map(
        (size) => size.id,
      );

      if (sizeIds.length > 0) {
        const relatedOrderItems = await tx.orderItem.count({
          where: {
            productSizeId: {
              in: sizeIds,
            },
          },
        });

        if (relatedOrderItems > 0) {
          throw new ConflictException(
            'Não é possível excluir um produto usado em pedidos. ' +
            'Desative sua disponibilidade para preservar o histórico.',
          );
        }
      }

      await tx.productSize.deleteMany({
        where: {
          productId: id,
        },
      });

      await tx.product.delete({
        where: { id },
      });
    });
  }

  private validateSizes(
    sizes: CreateProductSizeDto[],
  ): void {
    if (!Array.isArray(sizes) || sizes.length === 0) {
      throw new BadRequestException(
        'Informe pelo menos um tamanho para o produto.',
      );
    }

    const acceptedSizes = new Set<string>([
      ProductSize.PEQUENO,
      ProductSize.GRANDE,
    ]);

    const receivedSizes = new Set<string>();

    for (const size of sizes) {
      if (
        !size ||
        typeof size !== 'object' ||
        !acceptedSizes.has(size.size)
      ) {
        throw new BadRequestException(
          'Informe somente os tamanhos PEQUENO ou GRANDE.',
        );
      }

      if (receivedSizes.has(size.size)) {
        throw new BadRequestException(
          'Não é permitido repetir tamanhos no mesmo produto.',
        );
      }

      if (
        size.available !== undefined &&
        typeof size.available !== 'boolean'
      ) {
        throw new BadRequestException(
          'A disponibilidade do tamanho deve ser true ou false.',
        );
      }

      receivedSizes.add(size.size);
    }
  }
}