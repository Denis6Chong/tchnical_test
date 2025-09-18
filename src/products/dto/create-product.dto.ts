import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ 
    example: 'iPhone 15 Pro',
    description: 'Product name'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'Latest iPhone with advanced features',
    description: 'Product description',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 999.99,
    description: 'Product price'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ 
    example: 50,
    description: 'Stock quantity'
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({ 
    example: 'Electronics',
    description: 'Product category'
  })
  @IsString()
  @IsNotEmpty()
  category: string;
}