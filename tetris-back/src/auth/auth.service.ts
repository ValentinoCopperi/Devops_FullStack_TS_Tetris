import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { RedisService } from 'src/redis.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, createHash } from 'crypto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { AuthProvider, Role } from 'generated/prisma/client';

interface OAuthUserData {
  email: string;
  providerId: string;
  provider: AuthProvider;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  // ==================== REGISTRATION & LOGIN ====================

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // Log registration event
    await this.logAuditEvent({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'auth',
      success: true,
    });

    // TODO: Integrar con el servicio de email para enviar el token de verificación
    this.logger.log(`Verification token for ${user.email}: ${emailVerificationToken}`);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await this.logAuditEvent({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: `Failed login attempt for email: ${email}`,
        success: false,
      });
      return null;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.logAuditEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: `Failed login attempt (${failedAttempts}/5)`,
        success: false,
      });

      return null;
    }

    // Reset failed login attempts on successful validation
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    return user;
  }

  async login(user: any, ipAddress: string, userAgent: string) {
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    // Update last login info
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
      },
    });

    // Log successful login
    await this.logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress,
      userAgent,
      success: true,
    });

    return tokens;
  }

  // ==================== TOKEN MANAGEMENT ====================

  async generateTokens(user: any, ipAddress: string, userAgent: string) {
    const tokenFamily = uuidv4();

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'refresh',
      tokenFamily,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        tokenFamily,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
    };
  }

  async refreshTokens(oldRefreshToken: any, ipAddress: string, userAgent: string) {
    const userId = oldRefreshToken.userId;

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: oldRefreshToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens with same token family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokenFamily = oldRefreshToken.tokenFamily;

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'refresh',
      tokenFamily,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        tokenFamily,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    // Log logout event
    await this.logAuditEvent({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      success: true,
    });

    return { message: 'Logout successful' };
  }

  async revokeAllTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    // Log token revocation
    await this.logAuditEvent({
      userId,
      action: 'TOKENS_REVOKED',
      resource: 'auth',
      details: 'All tokens revoked',
      success: true,
    });

    return { message: 'All tokens revoked successfully' };
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Log email verification
    await this.logAuditEvent({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      resource: 'auth',
      success: true,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const emailVerificationToken = this.generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // TODO: Send verification email
    this.logger.log(`Verification token for ${user.email}: ${emailVerificationToken}`);

    return { message: 'Verification email sent' };
  }

  // ==================== PASSWORD RESET ====================

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = this.generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send password reset email
    this.logger.log(`Password reset token for ${user.email}: ${resetToken}`);

    // Log password reset request
    await this.logAuditEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'auth',
      success: true,
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all existing tokens
    await this.revokeAllTokens(user.id);

    // Log password reset
    await this.logAuditEvent({
      userId: user.id,
      action: 'PASSWORD_RESET',
      resource: 'auth',
      success: true,
    });

    return { message: 'Password reset successfully' };
  }

  // ==================== TWO-FACTOR AUTHENTICATION ====================

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `Tetris (${user.email})`,
      length: 32,
    });

    // Store secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Verify the token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      },
    });

    // Log 2FA enablement
    await this.logAuditEvent({
      userId,
      action: '2FA_ENABLED',
      resource: 'auth',
      success: true,
    });

    return {
      message: '2FA enabled successfully',
      backupCodes,
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    // Try to verify with TOTP
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValidTotp) {
      return { valid: true };
    }

    // Try backup codes
    if (user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      
      for (let i = 0; i < backupCodes.length; i++) {
        const isValid = await bcrypt.compare(token, backupCodes[i]);
        if (isValid) {
          // Remove used backup code
          backupCodes.splice(i, 1);
          await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
          });
          return { valid: true, usedBackupCode: true };
        }
      }
    }

    return { valid: false };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    // Log 2FA disablement
    await this.logAuditEvent({
      userId,
      action: '2FA_DISABLED',
      resource: 'auth',
      success: true,
    });

    return { message: '2FA disabled successfully' };
  }

  // ==================== OAUTH ====================

  async findOrCreateOAuthUser(data: OAuthUserData) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          {
            provider: data.provider,
            providerId: data.providerId,
          },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          provider: data.provider,
          providerId: data.providerId,
          firstName: data.firstName,
          lastName: data.lastName,
          isEmailVerified: true, // OAuth emails are pre-verified
        },
      });

      // Log OAuth registration
      await this.logAuditEvent({
        userId: user.id,
        action: 'OAUTH_REGISTERED',
        resource: 'auth',
        details: `Provider: ${data.provider}`,
        success: true,
      });
    } else if (!user.providerId || user.provider !== data.provider) {
      // Link OAuth provider to existing account
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: data.provider,
          providerId: data.providerId,
          isEmailVerified: true,
        },
      });
    }

    return user;
  }

  // ==================== UTILITIES ====================

  private generateSecureToken(): string {
    return createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(randomBytes(4).toString('hex'));
    }
    return codes;
  }

  private async logAuditEvent(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }) {
    try {
      await this.prisma.auditLog.create({
        data,
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
    }
  }
}

