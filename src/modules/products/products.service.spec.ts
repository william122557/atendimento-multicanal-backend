import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    productSize: {
      findFirst: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productSize: {
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(prisma);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findAll deve retornar a lista de produtos', async () => {
    const products = [
      { id: 1, name: 'Pizza', sizes: [] },
      { id: 2, name: 'Hambúrguer', sizes: [] },
    ];

    prisma.product.findMany.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      include: {
        sizes: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  });

  it('findOne deve retornar um produto quando existir', async () => {
    const product = { id: 1, name: 'Pizza', sizes: [] };

    prisma.product.findUnique.mockResolvedValue(product);

    await expect(service.findOne(1)).resolves.toEqual(product);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sizes: true,
      },
    });
  });

  it('findOne deve lançar NotFoundException quando não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create deve criar um produto com sizes', async () => {
    const dto = {
      name: 'Produto teste',
      category: 'Categoria',
      available: true,
      displayOrder: 1,
      sizes: [
        { size: 'PEQUENO', available: true },
        { size: 'GRANDE', available: false },
      ],
    };

    const created = {
      id: 1,
      ...dto,
      sizes: [
        { id: 10, size: 'PEQUENO', available: true },
        { id: 11, size: 'GRANDE', available: false },
      ],
    };

    prisma.product.create.mockResolvedValue(created);

    await expect(service.create(dto as any)).resolves.toEqual(created);
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: dto.name,
        category: dto.category,
        available: true,
        displayOrder: dto.displayOrder,
        sizes: {
          create: dto.sizes.map((size) => ({
            size: size.size,
            available: size.available ?? true,
          })),
        },
      },
      include: {
        sizes: true,
      },
    });
  });

  it('update deve atualizar um produto existente', async () => {
    const existing = {
      id: 1,
      name: 'Antigo',
      category: 'Categoria',
      available: true,
      displayOrder: 1,
      sizes: [],
    };

    const updated = {
      ...existing,
      name: 'Novo nome',
      available: false,
    };

    prisma.product.findUnique.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue(updated);

    await expect(
      service.update(1, { name: 'Novo nome', available: false } as any),
    ).resolves.toEqual(updated);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sizes: true,
      },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalled();
  });

  it('update deve lançar NotFoundException se o produto não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.update(999, { name: 'X' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateSize deve atualizar um tamanho existente', async () => {
    const product = {
      id: 1,
      name: 'Pizza',
      sizes: [
        { id: 100, size: 'PEQUENO', available: true },
        { id: 101, size: 'GRANDE', available: false },
      ],
    };

    const updatedProduct = {
      ...product,
      sizes: [
        { id: 100, size: 'PEQUENO', available: false },
        { id: 101, size: 'GRANDE', available: false },
      ],
    };

    prisma.product.findUnique
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(updatedProduct);

    prisma.productSize.findFirst.mockResolvedValue({
      id: 100,
      productId: 1,
      size: 'PEQUENO',
      available: true,
    });

    prisma.productSize.count.mockResolvedValue(1);

    prisma.productSize.update.mockResolvedValue({
      id: 100,
      productId: 1,
      size: 'PEQUENO',
      available: false,
    });

    await expect(
      service.updateSize(1, 100, { available: false } as any),
    ).resolves.toEqual(updatedProduct);

    expect(prisma.productSize.findFirst).toHaveBeenCalledWith({
      where: {
        id: 100,
        productId: 1,
      },
    });

    expect(prisma.productSize.count).toHaveBeenCalled();
    expect(prisma.productSize.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: {
        available: false,
      },
    });
  });

  it('updateSize deve lançar NotFoundException se o produto não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.updateSize(999, 100, { available: false } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove deve deletar um produto existente', async () => {
    const product = { id: 1, name: 'Pizza', sizes: [] };

    prisma.product.findUnique.mockResolvedValue(product);
    prisma.productSize.deleteMany.mockResolvedValue({ count: 1 });
    prisma.product.delete.mockResolvedValue(product);

    await expect(service.remove(1)).resolves.toBeUndefined();

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sizes: true,
      },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.productSize.deleteMany).toHaveBeenCalledWith({
      where: { productId: 1 },
    });
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('remove deve lançar NotFoundException se o produto não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});