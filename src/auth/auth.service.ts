import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      console.log("register service")
      const { name, email, password, isAdmin } = registerDto;
      console.log("regdto done")

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      console.log("findUnique end")

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log("hash created")

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          isAdmin: isAdmin,
        },
      });
      console.log("created user");

      // Generate JWT token
      const payload = { 
        userId: user.id, 
        email: user.email,
        sub: user.id // Standard JWT claim
      };
      const token = this.jwtService.sign(payload);
      console.log("token sign");

      return {
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          isAdmin: user.isAdmin,
        },
        access_token: token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT token
      const payload = { 
        userId: user.id, 
        email: user.email,
        sub: user.id // Standard JWT claim
      };
      const token = this.jwtService.sign(payload);

      return {
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        access_token: token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  }
}