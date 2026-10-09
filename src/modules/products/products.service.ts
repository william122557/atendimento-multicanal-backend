import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductSizeDto } from './dto/update-product-size.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      include: {
        sizes: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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
    const hasAvailableSizes = data.sizes.some((size) => size.available ?? true);

    return this.prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        available: hasAvailableSizes,
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
    await this.findOne(id);

    const { sizes, ...productData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (sizes) {
        await tx.productSize.deleteMany({
          where: { productId: id },
        });
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(sizes
            ? {
                sizes: {
                  create: sizes.map((size) => ({
                    size: size.size,
                    available: size.available ?? true,
                  })),
                },
              }
            : {}),
        },
        include: {
          sizes: true,
        },
      });

      if (sizes) {
        const hasAvailableSizes = updatedProduct.sizes.some(
          (size) => size.available,
        );

        if (updatedProduct.available !== hasAvailableSizes) {
          return tx.product.update({
            where: { id },
            data: {
              available: hasAvailableSizes,
            },
            include: {
              sizes: true,
            },
          });
        }
      }

      return updatedProduct;
    });
  }

  async updateSize(
    productId: number,
    sizeId: number,
    data: UpdateProductSizeDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const productSize = await tx.productSize.findFirst({
        where: {
          id: sizeId,
          productId,
        },
      });

      if (!productSize) {
        throw new NotFoundException('Tamanho do produto não encontrado.');
      }

      await tx.productSize.update({
        where: { id: sizeId },
        data: {
          available: data.available,
        },
      });

      const availableSizesCount = await tx.productSize.count({
        where: {
          productId,
          available: true,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          available: availableSizesCount > 0,
        },
      });

      return tx.product.findUnique({
        where: { id: productId },
        include: {
          sizes: true,
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.productSize.deleteMany({
        where: { productId: id },
      });

      await tx.product.delete({
        where: { id },
      });
    });
  }
}