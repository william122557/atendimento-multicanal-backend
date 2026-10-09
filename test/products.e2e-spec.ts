import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdProductId: number;
  let createdSizeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    await prisma.productSize.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.productSize.deleteMany();
    await prisma.product.deleteMany();
    await app.close();
  });

  it('GET /api/products deve retornar 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/products deve criar um produto', async () => {
    const payload = {
      name: 'Produto E2E',
      category: 'Teste',
      available: true,
      displayOrder: 10,
      sizes: [
        { size: 'PEQUENO', available: true },
        { size: 'GRANDE', available: false },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/api/products')
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Produto E2E',
      category: 'Teste',
      available: true,
      displayOrder: 10,
    });

    expect(response.body.sizes).toHaveLength(2);

    createdProductId = response.body.id;
    createdSizeId = response.body.sizes.find(
      (size: { size: string }) => size.size === 'PEQUENO',
    ).id;
  });

  it('GET /api/products/:id deve retornar o produto criado', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/products/${createdProductId}`)
      .expect(200);

    expect(response.body.id).toBe(createdProductId);
    expect(response.body.name).toBe('Produto E2E');
  });

  it('PATCH /api/products/:id deve atualizar o produto', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/products/${createdProductId}`)
      .send({ available: false, name: 'Produto E2E Atualizado' })
      .expect(200);

    expect(response.body.available).toBe(false);
    expect(response.body.name).toBe('Produto E2E Atualizado');
  });

  it('PATCH /api/products/:productId/sizes/:sizeId deve atualizar o tamanho', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/products/${createdProductId}/sizes/${createdSizeId}`)
      .send({ available: false })
      .expect(200);

    const updatedSize = response.body.sizes.find(
      (size: { id: number }) => size.id === createdSizeId,
    );

    expect(updatedSize).toBeDefined();
    expect(updatedSize.available).toBe(false);
  });

  it('POST /api/products deve rejeitar body inválido', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .send({ name: 'Inválido' })
      .expect(400);
  });

  it('DELETE /api/products/:id deve remover o produto', async () => {
    await request(app.getHttpServer())
      .delete(`/api/products/${createdProductId}`)
      .expect(204);
  });

  it('GET /api/products/:id após delete deve retornar 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/products/${createdProductId}`)
      .expect(404);
  });
});