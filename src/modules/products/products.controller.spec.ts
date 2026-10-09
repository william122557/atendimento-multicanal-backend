import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateSize: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateSize: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findAll deve retornar produtos do service', async () => {
    const result = [{ id: 1, name: 'Pizza' }];
    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll()).resolves.toEqual(result);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne deve chamar service.findOne com o id', async () => {
    const result = { id: 1, name: 'Pizza' };
    service.findOne.mockResolvedValue(result);

    await expect(controller.findOne(1)).resolves.toEqual(result);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('create deve chamar service.create com o dto', async () => {
    const dto = {
      name: 'Produto teste',
      category: 'Categoria',
      available: true,
      displayOrder: 1,
      sizes: [{ size: 'PEQUENO', available: true }],
    };
    const result = { id: 1, ...dto };

    service.create.mockResolvedValue(result);

    await expect(controller.create(dto as any)).resolves.toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update deve chamar service.update com id e dto', async () => {
    const dto = { name: 'Atualizado', available: false };
    const result = { id: 1, ...dto };

    service.update.mockResolvedValue(result);

    await expect(controller.update(1, dto as any)).resolves.toEqual(result);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('updateSize deve chamar service.updateSize com productId, sizeId e dto', async () => {
    const dto = { available: false };
    const result = {
      id: 1,
      sizes: [{ id: 10, available: false }],
    };

    service.updateSize.mockResolvedValue(result);

    await expect(controller.updateSize(1, 10, dto as any)).resolves.toEqual(result);
    expect(service.updateSize).toHaveBeenCalledWith(1, 10, dto);
  });

  it('remove deve chamar service.remove com id', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove(1)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});