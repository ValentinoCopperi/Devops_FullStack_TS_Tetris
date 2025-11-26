import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import {
  UserEnvelopeResponseDto,
  UserResponseDto,
} from './dtos/res/users.res.dto';
import { CreateUserRequestDto } from './dtos/req/create-user.req.dto';
import { UpdateUserRequestDto } from './dtos/req/update-user.req.dto';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

type UserSelectedPayload = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly scrypt = promisify(_scrypt);
  private readonly userSelect = {
    id: true,
    email: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async getUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      select: this.userSelect,
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async createUser(
    payload: CreateUserRequestDto,
  ): Promise<UserEnvelopeResponseDto> {
    const hashedPassword = await this.hashPassword(payload.password);

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email: payload.email.toLowerCase(),
          password: hashedPassword,
        },
        select: this.userSelect,
      });

      return {
        status: HttpStatus.CREATED,
        message: 'Usuario creado correctamente.',
        data: this.toUserResponse(createdUser),
      };
    } catch (error) {
      this.handlePrismaException(error);
      throw new InternalServerErrorException(
        'No fue posible crear el usuario.',
      );
    }
  }

  async updateUser(
    id: string,
    payload: UpdateUserRequestDto,
  ): Promise<UserEnvelopeResponseDto> {
    if (!payload.email && !payload.password) {
      throw new BadRequestException(
        'Debe proporcionar al menos un campo para actualizar.',
      );
    }

    const data: Prisma.UserUpdateInput = {};

    if (payload.email) {
      data.email = payload.email.toLowerCase();
    }

    if (payload.password) {
      data.password = await this.hashPassword(payload.password);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data,
        select: this.userSelect,
      });

      return {
        status: HttpStatus.OK,
        message: 'Usuario actualizado correctamente.',
        data: this.toUserResponse(updatedUser),
      };
    } catch (error) {
      this.handlePrismaException(error, id);
      throw new InternalServerErrorException(
        'No fue posible actualizar el usuario.',
      );
    }
  }

  private toUserResponse(user: UserSelectedPayload): UserResponseDto {
    return user as UserResponseDto;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await this.scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private handlePrismaException(error: unknown, id?: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          `No se encontró el usuario con identificador ${id}.`,
        );
      }
    }
  }
}
