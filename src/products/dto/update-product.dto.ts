import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// src/products/dto/query-products.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProductsDto {
  @ApiProperty({ 
    required: false, 
    default: 1,
    description: 'Page number'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    required: false, 
    default: 10,
    description: 'Items per page (max 50)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ 
    required: false,
    description: 'Filter by category'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ 
    required: false,
    description: 'Minimum price filter'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ 
    required: false,
    description: 'Maximum price filter'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ 
    required: false,
    description: 'Search in product name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    required: false,
    enum: ['name', 'price', 'createdAt'],
    description: 'Sort field'
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order'
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
