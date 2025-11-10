import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserEntity } from '../src/entities/user.entity';

describe('Sections admin endpoints (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let menuId: string;
  let sectionId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    // Mirror main.ts versioning so routes match /v1/... pattern
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v' });
    await app.init();
    server = app.getHttpServer();
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(UserEntity);
    let admin = await userRepo.findOne({ where: { email: 'owner@test.com' } });
    if (!admin) {
      admin = userRepo.create({
        email: 'owner@test.com',
        username: 'owner',
        password_hash: 'owner123',
        role: 'admin',
      });
      await userRepo.save(admin);
    }
    // login admin (expect 200)
    const loginRes = await request(server)
      .post('/v1/admin/auth/login')
      .send({ email: 'owner@test.com', password: 'owner123' })
      .expect(201);
    accessToken = loginRes.body.access_token;

    // create a restaurant
    const uniqueSlug = `test-resto-${Date.now()}`;
    const restaurantRes = await request(server)
      .post('/v1/admin/restaurants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Resto', slug: uniqueSlug })
      .expect(201);
    const restaurantId = restaurantRes.body.id;

    // create a menu under restaurant
    const menuRes = await request(server)
      .post(`/v1/admin/restaurants/${restaurantId}/menus`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Main Menu', is_published: false })
      .expect(201);
    menuId = menuRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a section', async () => {
    const res = await request(server)
      .post(`/v1/admin/menus/${menuId}/sections`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Starters', description: 'Light bites', sort_order: 0 })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Starters');
    sectionId = res.body.id;
  });

  it('gets a section', async () => {
    const res = await request(server)
      .get(`/v1/admin/sections/${sectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.id).toBe(sectionId);
    expect(res.body.name).toBe('Starters');
  });

  it('updates a section', async () => {
    const res = await request(server)
      .patch(`/v1/admin/sections/${sectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Entrées', sort_order: 5 })
      .expect(200);
    expect(res.body.name).toBe('Entrées');
    expect(res.body.sort_order).toBe(5);
  });

  it('reorders items empty array fails', async () => {
    await request(server)
      .post(`/v1/admin/sections/${sectionId}/items/reorder`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ item_ids: [] })
      .expect(400);
  });

  it('deletes a section', async () => {
    await request(server)
      .delete(`/v1/admin/sections/${sectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    // verify 404 afterwards
    await request(server)
      .get(`/v1/admin/sections/${sectionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
