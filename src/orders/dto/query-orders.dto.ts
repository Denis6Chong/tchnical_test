import { IsOptional, IsNumber, Min, IsIn, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryOrdersDto {
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
    enum: ['total', 'createdAt'],
    description: 'Sort field'
  })
  @IsOptional()
  @IsString()
  @IsIn(['total', 'createdAt'])
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