import { Injectable } from '@nestjs/common';

@Injectable()
export class IfoodConfigService {
  readonly apiBaseUrl = 'https://merchant-api.ifood.com.br';

  get clientId(): string {
    return this.requireEnvironmentVariable('IFOOD_CLIENT_ID');
  }

  get clientSecret(): string {
    return this.requireEnvironmentVariable('IFOOD_CLIENT_SECRET');
  }

  get merchantId(): string {
    return this.requireEnvironmentVariable('IFOOD_MERCHANT_ID');
  }

  get catalogId(): string {
    return this.requireEnvironmentVariable('IFOOD_CATALOG_ID');
  }

  validateConfiguration(): void {
    const requiredVariables = [
      'IFOOD_CLIENT_ID',
      'IFOOD_CLIENT_SECRET',
      'IFOOD_MERCHANT_ID',
      'IFOOD_CATALOG_ID',
    ];

    const missingVariables = requiredVariables.filter(
      (name) => !process.env[name]?.trim(),
    );

    if (missingVariables.length > 0) {
      throw new Error(
        `Configuracao iFood incompleta. Variaveis ausentes: ${missingVariables.join(', ')}`,
      );
    }
  }

  private requireEnvironmentVariable(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new Error(
        `Variavel de ambiente obrigatoria nao configurada: ${name}`,
      );
    }

    return value;
  }
}