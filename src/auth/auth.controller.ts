import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  UseGuards,
  Get
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    example: {
      message: 'User registered successfully',
      user: {
        id: 'uuid-here',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      access_token: 'jwt-token-here'
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User already exists',
    example: {
      statusCode: 409,
      message: 'User with this email already exists'
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation error',
    example: {
      statusCode: 400,
      message: ['Password must be at least 6 characters long'],
      error: 'Bad Request'
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    example: {
      message: 'Login successful',
      user: {
        id: 'uuid-here',
        name: 'John Doe',
        email: 'john@example.com'
      },
      access_token: 'jwt-token-here'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials',
    example: {
      statusCode: 401,
      message: 'Invalid email or password'
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    example: {
      id: 'uuid-here',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token'
  })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
