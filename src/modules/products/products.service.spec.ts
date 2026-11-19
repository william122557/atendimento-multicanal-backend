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
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });
  });

  it('findOne deve retornar um produto quando existir', async () => {
    const product = {
      id: 1,
      name: 'Pizza',
      sizes: [],
    };

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

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
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
      service.update(1, {
        name: 'Novo nome',
        available: false,
      }),
    ).resolves.toEqual(updated);

    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        sizes: true,
      },
    });

    expect(prisma.$transaction).toHaveBeenCalled();

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: 'Novo nome',
        available: false,
      },
      include: {
        sizes: true,
      },
    });
  });

  it('update deve lançar NotFoundException se o produto não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.update(999, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('updateSize deve atualizar um tamanho existente', async () => {
    const product = {
      id: 1,
      name: 'Pizza',
      available: true,
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

    prisma.productSize.update.mockResolvedValue({
      id: 100,
      productId: 1,
      size: 'PEQUENO',
      available: false,
    });

    const result = await service.updateSize(
      1,
      100,
      { available: false },
    );

    expect(result).toEqual(updatedProduct);

    expect(prisma.productSize.findFirst).toHaveBeenCalledWith({
      where: {
        id: 100,
        productId: 1,
      },
    });

    expect(prisma.productSize.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: {
        available: false,
      },
    });

    expect(prisma.productSize.count).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('updateSize deve manter o produto pausado ao ativar um tamanho', async () => {
    const product = {
      id: 1,
      name: 'Bolo de chocolate',
      available: false,
      sizes: [
        {
          id: 100,
          productId: 1,
          size: 'PEQUENO',
          available: false,
        },
        {
          id: 101,
          productId: 1,
          size: 'GRANDE',
          available: false,
        },
      ],
    };

    const updatedProduct = {
      ...product,
      sizes: [
        {
          ...product.sizes[0],
          available: true,
        },
        product.sizes[1],
      ],
    };

    prisma.product.findUnique
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(updatedProduct);

    prisma.productSize.findFirst.mockResolvedValue(product.sizes[0]);

    prisma.productSize.update.mockResolvedValue(updatedProduct.sizes[0]);

    const result = await service.updateSize(
      1,
      100,
      { available: true },
    );

    expect(prisma.productSize.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: {
        available: true,
      },
    });

    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(prisma.productSize.count).not.toHaveBeenCalled();

    expect(result).toEqual(updatedProduct);
    expect(result?.available).toBe(false);

    expect(
      result?.sizes.find((size) => size.id === 100)?.available,
    ).toBe(true);
  });

  it('updateSize deve lançar NotFoundException se o produto não existir', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      service.updateSize(999, 100, { available: false }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.productSize.update).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('remove deve deletar um produto existente', async () => {
    const product = {
      id: 1,
      name: 'Pizza',
      sizes: [],
    };

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

    await expect(service.remove(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.productSize.deleteMany).not.toHaveBeenCalled();
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});