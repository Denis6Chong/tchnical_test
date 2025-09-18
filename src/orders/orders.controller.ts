import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    example: {
      message: 'Order created successfully',
      order: {
        id: 'uuid-order-here',
        total: 1999.98,
        createdAt: '2024-01-01T00:00:00.000Z',
        items: [
          {
            id: 'uuid-item-here',
            quantity: 2,
            price: 999.99,
            product: {
              id: 'uuid-product-here',
              name: 'iPhone 15 Pro',
              category: 'Electronics'
            }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    example: {
      orders: [
        {
          id: 'uuid-order-here',
          total: 1999.98,
          createdAt: '2024-01-01T00:00:00.000Z',
          itemsCount: 2,
          items: [
            {
              id: 'uuid-item-here',
              quantity: 2,
              price: 999.99,
              product: {
                id: 'uuid-product-here',
                name: 'iPhone 15 Pro',
                category: 'Electronics'
              }
            }
          ]
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: QueryOrdersDto, @CurrentUser() user: any) {
    return this.ordersService.findAllByUser(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
    example: {
      totalOrders: 150,
      totalRevenue: 45000.50,
      avgOrderValue: 300.00
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStats() {
    // Note: In a real app, you'd add admin role checking here
    return this.ordersService.getOrderStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
    example: {
      id: 'uuid-order-here',
      total: 1999.98,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      user: {
        id: 'uuid-user-here',
        name: 'John Doe',
        email: 'john@example.com'
      },
      items: [
        {
          id: 'uuid-item-here',
          quantity: 2,
          price: 999.99,
          subtotal: 1999.98,
          product: {
            id: 'uuid-product-here',
            name: 'iPhone 15 Pro',
            description: 'Latest iPhone',
            category: 'Electronics'
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only access own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    // Note: In a real app, you'd check if user is admin to bypass ownership check
    return this.ordersService.findOne(id, user.id, false);
  }
}