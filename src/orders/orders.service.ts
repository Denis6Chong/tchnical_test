import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    // Use transaction to ensure data consistency
    return await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: { productId: string; quantity: number; price: Prisma.Decimal }[] = [];

      // Validate products and calculate total
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price, // Store price at time of order
        });
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          total: totalAmount,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return {
        message: 'Order created successfully',
        order: {
          id: order.id,
          total: order.total,
          createdAt: order.createdAt,
          items: order.orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: item.product,
          })),
        },
      };
    });
  }

  async findAllByUser(userId: string, queryDto: QueryOrdersDto) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: { userId },
          take,
          skip,
          orderBy,
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.order.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        orders: orders.map(order => ({
          id: order.id,
          total: order.total,
          createdAt: order.createdAt,
          itemsCount: order.orderItems.length,
          items: order.orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: item.product,
          })),
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  async findOne(orderId: string, userId: string, isAdmin: boolean = false) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Check if user owns the order or is admin
      if (!isAdmin && order.userId !== userId) {
        throw new ForbiddenException('You can only access your own orders');
      }

      return {
        id: order.id,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.user,
        items: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: Number(item.price) * item.quantity,
          product: item.product,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Invalid order ID');
    }
  }

  // Admin method to get all orders
  async findAll(queryDto: QueryOrdersDto) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          take,
          skip,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.order.count(),
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        orders: orders.map(order => ({
          id: order.id,
          total: order.total,
          createdAt: order.createdAt,
          user: order.user,
          itemsCount: order.orderItems.length,
          items: order.orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: item.product,
          })),
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch orders');
    }
  }

  // Get order statistics for admin
  async getOrderStats() {
    try {
      const [totalOrders, totalRevenue, avgOrderValue] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          _avg: { total: true },
        }),
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        avgOrderValue: avgOrderValue._avg.total || 0,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch order statistics');
    }
  }
}