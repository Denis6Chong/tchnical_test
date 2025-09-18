import { IsEmail, IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'john@example.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    example: 'john@example.com',
    description: 'User email address'
  })
  @IsBoolean()
  @IsNotEmpty()
  isAdmin: boolean;

}