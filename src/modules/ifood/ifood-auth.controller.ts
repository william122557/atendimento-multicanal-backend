import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { IfoodAuthService } from './ifood-auth.service';
import { IfoodCatalogService } from './ifood-catalog.service';

@Controller('ifood/auth')
export class IfoodAuthController {
  constructor(
    private readonly authService: IfoodAuthService,
    private readonly catalogService: IfoodCatalogService,
  ) {}

  @Get('check')
  async checkAuthentication() {
    try {
      await this.authService.getAccessToken();

      return {
        authenticated: true,
        message: 'Autenticacao com o iFood validada com sucesso.',
      };
    } catch (error) {
      throw new HttpException(
        {
          authenticated: false,
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel autenticar no iFood.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('catalog')
  async getCatalogs() {
    try {
      const catalogs = await this.catalogService.getCatalogs();

      return {
        success: true,
        catalogs,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel consultar os catalogos no iFood.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('categories')
  async getCategories() {
    try {
      const categories = await this.catalogService.getCategories();

      return {
        success: true,
        categories,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel consultar as categorias no iFood.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('user-code')
  async createUserCode() {
    try {
      return await this.authService.createUserCode();
    } catch (error) {
      throw new HttpException(
        {
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel gerar o userCode.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('authorization-code')
  async exchangeAuthorizationCode(
    @Body('authorizationCode') authorizationCode: unknown,
  ) {
    if (
      typeof authorizationCode !== 'string' ||
      !authorizationCode.trim()
    ) {
      throw new HttpException(
        {
          message: 'O campo authorizationCode deve ser um texto nao vazio.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.authService.exchangeAuthorizationCode(
        authorizationCode.trim(),
      );
    } catch (error) {
      throw new HttpException(
        {
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel trocar o authorizationCode por tokens.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('items/:itemId/status')
  async updateItemStatus(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body('status') status: unknown,
  ) {
    if (status !== 'AVAILABLE' && status !== 'UNAVAILABLE') {
      throw new HttpException(
        {
          success: false,
          message: 'Informe status AVAILABLE ou UNAVAILABLE.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.catalogService.updateItemStatus(
        itemId,
        status,
      );

      return {
        success: true,
        itemId: result.itemId,
        status: result.status,
        updatedOptions: result.updatedOptions,
      };
    } catch {
      throw new HttpException(
        {
          success: false,
          message:
            'Nao foi possivel atualizar o item. Consulte o log do backend.',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Patch('options/:optionId/status')
  async updateOptionStatus(
    @Param('optionId', new ParseUUIDPipe()) optionId: string,
    @Body('status') status: unknown,
  ) {
    if (status !== 'AVAILABLE' && status !== 'UNAVAILABLE') {
      throw new HttpException(
        {
          success: false,
          message: 'Informe status AVAILABLE ou UNAVAILABLE.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.catalogService.updateOptionStatus(
        optionId,
        status,
      );

      return {
        success: true,
        ...result,
      };
    } catch {
      throw new HttpException(
        {
          success: false,
          message:
            'Nao foi possivel atualizar a opcao. Consulte o log do backend.',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Patch('massa/:massa/:tamanho/status')
  async updateMassaStatus(
    @Param('massa') massa: string,
    @Param('tamanho') tamanho: string,
    @Body('status') status: unknown,
  ) {
    const massasValidas = ['branca', 'chocolate'];
    const tamanhosValidos = ['pequeno', 'grande'];

    if (!massasValidas.includes(massa)) {
      throw new HttpException(
        {
          success: false,
          message: 'Informe massa branca ou chocolate.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!tamanhosValidos.includes(tamanho)) {
      throw new HttpException(
        {
          success: false,
          message: 'Informe tamanho pequeno ou grande.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (status !== 'AVAILABLE' && status !== 'UNAVAILABLE') {
      throw new HttpException(
        {
          success: false,
          message: 'Informe status AVAILABLE ou UNAVAILABLE.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.catalogService.updateMassaStatus(
        massa as 'branca' | 'chocolate',
        tamanho as 'pequeno' | 'grande',
        status,
      );

      return {
        success: true,
        ...result,
      };
    } catch {
      throw new HttpException(
        {
          success: false,
          message:
            'Nao foi possivel atualizar o controle de massa. Consulte o log do backend.',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}