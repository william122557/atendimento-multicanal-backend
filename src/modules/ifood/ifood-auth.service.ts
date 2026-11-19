import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IfoodConfigService } from './ifood-config.service';

interface IfoodUserCodeResponse {
  userCode: string;
  authorizationCodeVerifier: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresIn: number;
}

interface IfoodTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class IfoodAuthService implements OnModuleInit {
  private readonly logger = new Logger(IfoodAuthService.name);

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  private pendingUserCode: string | null = null;
  private pendingAuthorizationCodeVerifier: string | null = null;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: IfoodConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadStoredTokens();
  }

  async getAccessToken(): Promise<string> {
    if (this.hasValidAccessToken()) {
      return this.accessToken as string;
    }

    await this.loadStoredTokens();

    if (this.hasValidAccessToken()) {
      return this.accessToken as string;
    }

    if (this.refreshToken) {
      return this.refreshAccessToken();
    }

    throw new Error(
      'Aplicativo ainda nao autorizado. Gere o userCode e conclua a autorizacao no Portal do Parceiro.',
    );
  }

  async createUserCode(): Promise<{
    userCode: string;
    verificationUrl: string;
    verificationUrlComplete: string;
    expiresIn: number;
  }> {
    const body = new URLSearchParams({
      clientId: this.configService.clientId,
    });

    const response = await fetch(
      `${this.configService.apiBaseUrl}/authentication/v1.0/oauth/userCode`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      this.logger.error(
        `Falha ao gerar userCode no iFood. Status: ${response.status}. Resposta: ${errorBody}`,
      );

      throw new Error('Nao foi possivel gerar o userCode no iFood.');
    }

    const data = (await response.json()) as IfoodUserCodeResponse;

    this.pendingUserCode = data.userCode;
    this.pendingAuthorizationCodeVerifier = data.authorizationCodeVerifier;

    return {
      userCode: data.userCode,
      verificationUrl: data.verificationUrl,
      verificationUrlComplete: data.verificationUrlComplete,
      expiresIn: data.expiresIn,
    };
  }

  async exchangeAuthorizationCode(authorizationCode: string): Promise<{
    authenticated: boolean;
  }> {
    if (!this.pendingUserCode || !this.pendingAuthorizationCodeVerifier) {
      throw new Error(
        'Nao ha um userCode pendente. Gere um novo userCode antes de informar o authorizationCode.',
      );
    }

    const response = await this.requestToken({
      grantType: 'authorization_code',
      authorizationCode,
      userCode: this.pendingUserCode,
      authorizationCodeVerifier: this.pendingAuthorizationCodeVerifier,
    });

    await this.saveTokens(response);
    this.clearPendingAuthorization();

    return { authenticated: true };
  }

  private async loadStoredTokens(): Promise<void> {
    if (this.accessToken && this.hasValidAccessToken()) {
      return;
    }

    const storedToken = await this.prismaService.ifoodToken.findUnique({
      where: {
        merchantId: this.configService.merchantId,
      },
    });

    if (!storedToken) {
      return;
    }

    this.accessToken = storedToken.accessToken;
    this.refreshToken = storedToken.refreshToken;
    this.expiresAt = storedToken.expiresAt.getTime();
  }

  private async saveTokens(response: IfoodTokenResponse): Promise<void> {
    const expiresAt = new Date(Date.now() + response.expiresIn * 1000);

    await this.prismaService.ifoodToken.upsert({
      where: {
        merchantId: this.configService.merchantId,
      },
      update: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
      },
      create: {
        merchantId: this.configService.merchantId,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
      },
    });

    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.expiresAt = expiresAt.getTime();
  }

  private hasValidAccessToken(): boolean {
    if (!this.accessToken || !this.expiresAt) {
      return false;
    }

    const safetyMarginInMilliseconds = 60_000;

    return Date.now() < this.expiresAt - safetyMarginInMilliseconds;
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await this.requestToken({
      grantType: 'refresh_token',
      refreshToken: this.refreshToken as string,
    });

    await this.saveTokens(response);

    return response.accessToken;
  }

  private async requestToken(request: {
    grantType: 'authorization_code' | 'refresh_token';
    authorizationCode?: string;
    userCode?: string;
    authorizationCodeVerifier?: string;
    refreshToken?: string;
  }): Promise<IfoodTokenResponse> {
    const body = new URLSearchParams({
      clientId: this.configService.clientId,
      clientSecret: this.configService.clientSecret,
      grantType: request.grantType,
    });

    if (request.authorizationCode) {
      body.set('authorizationCode', request.authorizationCode);
    }

    if (request.userCode) {
      body.set('userCode', request.userCode);
    }

    if (request.authorizationCodeVerifier) {
      body.set('authorizationCodeVerifier', request.authorizationCodeVerifier);
    }

    if (request.refreshToken) {
      body.set('refreshToken', request.refreshToken);
    }

    const response = await fetch(
      `${this.configService.apiBaseUrl}/authentication/v1.0/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      this.logger.error(
        `Falha ao obter token no iFood. Status: ${response.status}. Resposta: ${errorBody}`,
      );

      throw new Error('Nao foi possivel obter o token no iFood.');
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  }

  private clearPendingAuthorization(): void {
    this.pendingUserCode = null;
    this.pendingAuthorizationCodeVerifier = null;
  }
}