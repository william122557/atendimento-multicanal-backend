import { Injectable, Logger } from '@nestjs/common';
import { IfoodAuthService } from './ifood-auth.service';
import { IfoodConfigService } from './ifood-config.service';

type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
type Massa = 'branca' | 'chocolate';
type Tamanho = 'pequeno' | 'grande';

@Injectable()
export class IfoodCatalogService {
  private readonly logger = new Logger(IfoodCatalogService.name);

  constructor(
    private readonly authService: IfoodAuthService,
    private readonly configService: IfoodConfigService,
  ) {}

  async getCatalogs(): Promise<any> {
    const accessToken = await this.authService.getAccessToken();

    const url =
      `${this.getMerchantBaseUrl()}/catalogs`;

    return this.requestCatalog(url, accessToken);
  }

  async getCategories(): Promise<any[]> {
    const accessToken = await this.authService.getAccessToken();

    const merchantBase = this.getMerchantBaseUrl();

    const categoriesUrl =
      `${merchantBase}/catalogs/` +
      `${encodeURIComponent(this.configService.catalogId)}/categories`;

    const categoriesResponse = await this.requestCatalog(
      categoriesUrl,
      accessToken,
    );

    if (!Array.isArray(categoriesResponse)) {
      throw new Error(
        'O iFood retornou um formato inesperado na consulta de categorias.',
      );
    }

    const categories: any[] = [];

    for (const category of categoriesResponse) {
      if (!category.id) {
        throw new Error(
          'Uma categoria retornada pelo iFood está sem ID.',
        );
      }

      const itemsUrl =
        `${merchantBase}/categories/` +
        `${encodeURIComponent(category.id)}/items`;

      const details = await this.requestCatalog(
        itemsUrl,
        accessToken,
      );

      if (
        !details ||
        !Array.isArray(details.items) ||
        !Array.isArray(details.products) ||
        !Array.isArray(details.optionGroups) ||
        !Array.isArray(details.options)
      ) {
        throw new Error(
          `Estrutura inesperada nos itens da categoria "${category.name}".`,
        );
      }

      const products = new Map<string, any>();
      const groups = new Map<string, any>();
      const options = new Map<string, any>();

      for (const product of details.products) {
        products.set(product.id, product);
      }

      for (const group of details.optionGroups) {
        groups.set(group.id, group);
      }

      for (const option of details.options) {
        options.set(option.id, option);
      }

      const items = details.items.map((item: any) => {
        const product = products.get(item.productId);

        if (!product) {
          throw new Error(
            `Produto ${item.productId} não encontrado para o item ${item.id}.`,
          );
        }

        const itemContext = (item.contextModifiers || []).find(
          (context: any) =>
            context.catalogContext === 'DEFAULT',
        );

        const itemGroups = (product.optionGroups || []).map(
          (groupReference: any) => {
            const group = groups.get(groupReference.id);

            if (!group) {
              throw new Error(
                `Grupo ${groupReference.id} não encontrado no produto "${product.name}".`,
              );
            }

            const groupOptions = (group.optionIds || []).map(
              (optionId: string) => {
                const option = options.get(optionId);

                if (!option) {
                  throw new Error(
                    `Opção ${optionId} não encontrada no grupo "${group.name}".`,
                  );
                }

                const optionProduct = products.get(
                  option.productId,
                );

                if (!optionProduct) {
                  throw new Error(
                    `Produto ${option.productId} não encontrado para a opção ${option.id}.`,
                  );
                }

                const optionContext = (
                  option.contextModifiers || []
                ).find(
                  (context: any) =>
                    context.catalogContext === 'DEFAULT',
                );

                return {
                  ...option,
                  name: optionProduct.name,
                  description: optionProduct.description || '',
                  status:
                    optionContext?.status ?? option.status,
                  price:
                    optionContext?.price ?? option.price,
                };
              },
            );

            groupOptions.sort(
              (a: any, b: any) =>
                (a.index ?? 0) - (b.index ?? 0),
            );

            return {
              ...group,
              min: groupReference.min ?? group.min,
              max: groupReference.max ?? group.max,
              index: groupReference.index ?? group.index,
              options: groupOptions,
            };
          },
        );

        itemGroups.sort(
          (a: any, b: any) =>
            (a.index ?? 0) - (b.index ?? 0),
        );

        return {
          ...item,
          name: product.name,
          description: product.description || '',
          imagePath: product.imagePath || '',
          status: itemContext?.status ?? item.status,
          price: itemContext?.price ?? item.price,
          optionGroups: itemGroups,
        };
      });

      items.sort(
        (a: any, b: any) =>
          (a.index ?? 0) - (b.index ?? 0),
      );

      categories.push({
        ...category,
        items,
      });
    }

    categories.sort(
      (a: any, b: any) =>
        (a.index ?? a.sequence ?? 0) -
        (b.index ?? b.sequence ?? 0),
    );

    return categories;
  }

  async updateItemStatus(
    itemId: string,
    status: AvailabilityStatus,
  ): Promise<{
    itemId: string;
    status: string;
    updatedOptions: number;
  }> {
    this.validateStatus(status);

    // Localizar os complementos antes de alterar o item.
    const categories = await this.getCategories();

    const matchingItems = categories
      .flatMap((category: any) => category.items || [])
      .filter((item: any) => item.id === itemId);

    if (matchingItems.length !== 1) {
      throw new Error(
        `Esperado um item com ID ${itemId}, mas foram encontrados ${matchingItems.length}.`,
      );
    }

    const item = matchingItems[0];

    const optionIds: string[] =
      status === 'UNAVAILABLE'
        ? Array.from(
            new Set<string>(
              (item.optionGroups || []).flatMap(
                (group: any) =>
                  (group.options || []).map(
                    (option: any) => option.id as string,
                  ),
              ),
            ),
          )
        : [];

    const accessToken =
      await this.authService.getAccessToken();

    const url =
      `${this.getMerchantBaseUrl()}/items/status`;

    await this.patchStatus(
      url,
      accessToken,
      { itemId, status },
      `item ${itemId}`,
    );

    let updatedOptions = 0;

    for (const optionId of optionIds) {
      try {
        await this.updateOptionStatus(
          optionId,
          'UNAVAILABLE',
        );

        updatedOptions += 1;
      } catch (error) {
        const detail = this.getErrorMessage(error);

        const message =
          `O item ${itemId} foi atualizado para ${status}, ` +
          `mas houve falha ao desativar seus complementos. ` +
          `${updatedOptions} de ${optionIds.length} opções atualizadas. ` +
          `Opção que falhou: ${optionId}. ` +
          `Detalhe: ${detail}`;

        this.logger.error(message);

        throw new Error(message);
      }
    }

    return {
      itemId,
      status,
      updatedOptions,
    };
  }

  async updateOptionStatus(
    optionId: string,
    status: AvailabilityStatus,
  ): Promise<{
    optionId: string;
    status: string;
  }> {
    this.validateStatus(status);

    const accessToken =
      await this.authService.getAccessToken();

    const url =
      `${this.getMerchantBaseUrl()}/options/status`;

    await this.patchStatus(
      url,
      accessToken,
      { optionId, status },
      `opção ${optionId}`,
    );

    return {
      optionId,
      status,
    };
  }

  async updateMassaStatus(
    massa: Massa,
    tamanho: Tamanho,
    status: AvailabilityStatus,
  ): Promise<{
    massa: string;
    tamanho: string;
    status: string;
    updatedOptions: number;
  }> {
    this.validateStatus(status);

    if (!['branca', 'chocolate'].includes(massa)) {
      throw new Error(
        'Informe massa branca ou chocolate.',
      );
    }

    if (!['pequeno', 'grande'].includes(tamanho)) {
      throw new Error(
        'Informe tamanho pequeno ou grande.',
      );
    }

    const categories = await this.getCategories();

    const itemNames =
      massa === 'branca'
        ? [
            'Bolo recheado nuteninho',
            'Chantininho com morango',
          ]
        : [
            'Bolo recheado chocolate com brigadeiro',
            'Chocolate com morango',
          ];

    const groupName =
      `Massa ${massa} ` +
      (tamanho === 'pequeno' ? 'pequena' : 'grande');

    const optionName =
      tamanho === 'pequeno'
        ? 'Tamanho pequeno'
        : 'Tamanho grande';

    const items = categories.flatMap(
      (category: any) => category.items || [],
    );

    const optionIds: string[] = [];

    // Validar os dois bolos antes de enviar alterações.
    for (const itemName of itemNames) {
      const matchingItems = items.filter(
        (item: any) =>
          this.normalize(item.name || '') ===
          this.normalize(itemName),
      );

      if (matchingItems.length !== 1) {
        throw new Error(
          `Esperado um item "${itemName}", ` +
          `mas foram encontrados ${matchingItems.length}.`,
        );
      }

      const item = matchingItems[0];

      const matchingGroups = (
        item.optionGroups || []
      ).filter(
        (group: any) =>
          this.normalize(group.name || '') ===
          this.normalize(groupName),
      );

      if (matchingGroups.length !== 1) {
        throw new Error(
          `Esperado um grupo "${groupName}" ` +
          `no item "${itemName}", mas foram encontrados ` +
          `${matchingGroups.length}.`,
        );
      }

      const matchingOptions = (
        matchingGroups[0].options || []
      ).filter(
        (option: any) =>
          this.normalize(option.name || '') ===
          this.normalize(optionName),
      );

      if (matchingOptions.length !== 1) {
        throw new Error(
          `Esperada uma opção "${optionName}" ` +
          `no item "${itemName}", mas foram encontradas ` +
          `${matchingOptions.length}.`,
        );
      }

      optionIds.push(matchingOptions[0].id);
    }

    const uniqueOptionIds = [
      ...new Set<string>(optionIds),
    ];

    const updatedIds: string[] = [];

    for (const optionId of uniqueOptionIds) {
      try {
        await this.updateOptionStatus(optionId, status);

        updatedIds.push(optionId);
      } catch (error) {
        const detail = this.getErrorMessage(error);

        const message =
          `Falha no controle ${massa}/${tamanho}. ` +
          `${updatedIds.length} de ${uniqueOptionIds.length} ` +
          `opções atualizadas. ` +
          `Opção que falhou: ${optionId}. ` +
          `Opções já atualizadas: ` +
          `${updatedIds.join(', ') || 'nenhuma'}. ` +
          `Detalhe: ${detail}`;

        this.logger.error(message);

        throw new Error(message);
      }
    }

    return {
      massa,
      tamanho,
      status,
      updatedOptions: updatedIds.length,
    };
  }

  private getMerchantBaseUrl(): string {
    return (
      `${this.configService.apiBaseUrl}/catalog/v2.0/merchants/` +
      encodeURIComponent(this.configService.merchantId)
    );
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase('pt-BR');
  }

  private validateStatus(
    status: AvailabilityStatus,
  ): void {
    if (
      status !== 'AVAILABLE' &&
      status !== 'UNAVAILABLE'
    ) {
      throw new Error(
        'Informe status AVAILABLE ou UNAVAILABLE.',
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : String(error);
  }

  private async patchStatus(
    url: string,
    accessToken: string,
    body: {
      itemId?: string;
      optionId?: string;
      status: AvailabilityStatus;
    },
    target: string,
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      this.logger.error(
        `Falha ao atualizar ${target} no iFood. ` +
        `HTTP ${response.status}. Resposta: ${errorBody}`,
      );

      throw new Error(
        `Não foi possível atualizar ${target} no iFood. ` +
        `HTTP ${response.status}.`,
      );
    }
  }

  private async requestCatalog(
    url: string,
    accessToken: string,
  ): Promise<any> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();

      this.logger.error(
        `Falha ao consultar o iFood. ` +
        `HTTP ${response.status}. Resposta: ${errorBody}`,
      );

      throw new Error(
        `Não foi possível consultar o catálogo no iFood. ` +
        `HTTP ${response.status}.`,
      );
    }

    return response.json();
  }
}