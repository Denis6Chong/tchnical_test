import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name.trim(),
          description: createProductDto.description?.trim(),
          price: createProductDto.price,
          stock: createProductDto.stock,
          category: createProductDto.category.trim(),
        },
      });

      return {
        message: 'Product created successfully',
        product,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(queryDto: QueryProductsDto) {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = queryDto;

    // Limit max items per page
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive',
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          take,
          skip,
          orderBy,
        }),
        this.prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          category,
          minPrice,
          maxPrice,
          search,
          sortBy,
          sortOrder,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch products');
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid product ID');
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      // Check if product exists
      await this.findOne(id);

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...(updateProductDto.name && { name: updateProductDto.name.trim() }),
          ...(updateProductDto.description && { description: updateProductDto.description.trim() }),
          ...(updateProductDto.price !== undefined && { price: updateProductDto.price }),
          ...(updateProductDto.stock !== undefined && { stock: updateProductDto.stock }),
          ...(updateProductDto.category && { category: updateProductDto.category.trim() }),
        },
      });

      return {
        message: 'Product updated successfully',
        product: updatedProduct,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: string) {
    try {
      // Check if product exists
      await this.findOne(id);

      // Check if product is used in any orders
      const orderCount = await this.prisma.orderItem.count({
        where: { productId: id },
      });

      if (orderCount > 0) {
        throw new BadRequestException(
          'Cannot delete product that exists in orders. Consider updating stock to 0 instead.'
        );
      }

      await this.prisma.product.delete({
        where: { id },
      });

      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete product');
    }
  }

  async getCategories() {
    try {
      const categories = await this.prisma.product.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });

      return categories.map(item => item.category);
    } catch (error) {
      throw new BadRequestException('Failed to fetch categories');
    }
  }
}
