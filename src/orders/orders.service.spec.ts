import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// Create a mock PrismaService
const mockPrismaService = {
  $transaction: jest.fn(),
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw NotFoundException if product does not exist', async () => {
      prisma.$transaction.mockImplementation(async (cb) => {
        prisma.product.findUnique.mockResolvedValueOnce(null);
        return cb(prisma as any);
      });

      await expect(
        service.create('user-1', {
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      prisma.$transaction.mockImplementation(async (cb) => {
        prisma.product.findUnique.mockResolvedValueOnce({
          id: 'prod-1',
          name: 'iPhone',
          stock: 0,
          price: 100,
        });
        return cb(prisma as any);
      });

      await expect(
        service.create('user-1', {
          items: [{ productId: 'prod-1', quantity: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an order and decrement stock', async () => {
      prisma.$transaction.mockImplementation(async (cb) => {
        prisma.product.findUnique.mockResolvedValueOnce({
          id: 'prod-1',
          name: 'iPhone',
          stock: 10,
          price: 100,
        });
        prisma.order.create.mockResolvedValueOnce({
          id: 'order-1',
          total: 100,
          createdAt: new Date(),
          orderItems: [
            {
              id: 'item-1',
              quantity: 1,
              price: 100,
              product: { id: 'prod-1', name: 'iPhone', category: 'Electronics' },
            },
          ],
        });
        prisma.product.update.mockResolvedValueOnce({}); // stock decrement

        return cb(prisma as any);
      });

      const result = await service.create('user-1', {
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(result.message).toBe('Order created successfully');
      expect(result.order.id).toBe('order-1');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: { decrement: 1 } },
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if order not found', async () => {
      prisma.order.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own order and is not admin', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'another-user',
        user: { id: 'another-user', name: 'Other', email: 'other@test.com' },
        orderItems: [],
      });

      await expect(service.findOne('order-1', 'user-1', false)).rejects.toThrow(ForbiddenException);
    });

    it('should return the order if user owns it', async () => {
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        total: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-1', name: 'John', email: 'john@test.com' },
        orderItems: [
          {
            id: 'item-1',
            quantity: 1,
            price: 100,
            product: { id: 'prod-1', name: 'iPhone', description: 'Latest', category: 'Electronics' },
          },
        ],
      });

      const result = await service.findOne('order-1', 'user-1');
      expect(result.id).toBe('order-1');
      expect(result.items[0].product.name).toBe('iPhone');
    });
  });
});
