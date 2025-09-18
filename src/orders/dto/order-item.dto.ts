import { IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product UUID',
    example: 'uuid-product-here'
  })
  @IsUUID(4, { message: 'Product ID must be a valid UUID' })
  productId: string;

  @ApiProperty({
    description: 'Quantity to order',
    example: 2,
    minimum: 1
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  quantity: number;
}
