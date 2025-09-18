import { IsEmail, IsString, MinLength, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: 'john@example.com',
    description: 'Valid email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'Password (minimum 6 characters)'
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsBoolean()
  isAdmin: boolean;
}
