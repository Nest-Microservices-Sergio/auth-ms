import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import { BcryptAdapter } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('AuthService');

  onModuleInit() {
    this.$connect();
    this.logger.log('AuthDB Connected');
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { name, email, password } = registerUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });

      if (user)
        throw new RpcException({
          status: 400,
          message: 'User already registered',
        });

      const newUser = await this.user.create({
        data: {
          name,
          email,
          password: BcryptAdapter.hash(password),
        },
      });

      const { password: __, ...rest } = newUser;

      return {
        user: rest,
        toke: 'ABC',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });

      if (!user)
        throw new RpcException({
          status: 400,
          message: 'Invalid credentials',
        });

      const isValidPassword = BcryptAdapter.compare(password, user.password);

      if (!isValidPassword)
        throw new RpcException({
          status: 400,
          message: 'User/Password do not match',
        });

      const { password: __, ...rest } = user;

      return {
        user: rest,
        token: 'ABC',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }
}
