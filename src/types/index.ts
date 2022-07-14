import { AxiosError, AxiosInstance } from "axios";

export interface EpServiceDeps<T extends {} = {}> {
  httpClient: AxiosInstance;
  headers?: Record<string, string>;
  accessToken: string;
  customerToken?: string;
  params?: T;
}

export type TokenIdentifier = ImplicitToken;
export type ImplicitToken = "implicit";
export type ClientCredentialsToken = "client_credentials";

export interface EpAccessTokenInterface<Identifier extends TokenIdentifier> {
  access_token: string;
  expires: number;
  expires_in: number;
  identifier: Identifier;
  token_type: "Bearer";
}

export type EpAxiosError = AxiosError<EpErrorResponse, EpErrorResponse>;

export interface EpErrorResponse {
  errors: EpError[];
}

export interface EpCollectionResponse<Data> {
  data: Data;
  links: {
    first: string;
    last: string;
    self: string;
  };
  meta: {
    page: {
      current: number;
      limit: number;
      total: number;
    };
    results: {
      total: number;
    };
  };
}

export interface EpError {
  status: number;
  title: string;
  detail: string;
  meta?: {
    id?: string;
  };
}

export type EpFlowFieldValue = string | number | boolean;
export type EpFlowFieldsInterface = Record<string, EpFlowFieldValue>;
export type EpPriceMap = Record<string, EpCurrencyPriceInterface>;
export interface EpCurrencyPriceInterface {
  amount: number;
  currency?: string;
  includes_tax: boolean;
}

export interface EpProductAttributes {
  base_product: false;
  commodity_type: "physical";
  created_at: string;
  description: string;
  manage_stock: boolean;
  name: string;
  price?: EpPriceMap;
  sku: string;
  slug: string;
  status: "live" | "draft";
  tiers?: {
    [key: string]: {
      minimum_quantity: number;
      price: EpPriceMap;
    };
  };
  extensions?: {
    [key: string]: EpFlowFieldsInterface;
  };
  updated_at: string;
  published_at: string;
  locales?: EpProductLocales;
}

export interface EpProductLocales {
  en?: EpProductLocaleAttributes;
  fr?: EpProductLocaleAttributes;
}

export interface EpProductLocaleAttributes {
  name: string;
  description?: string;
}

interface EpDisplayPrice {
  without_tax: EpDisplayPriceValue;
  with_tax?: EpDisplayPriceValue;
}

export interface EpDisplayPriceValue {
  amount: number;
  currency: string;
  formatted: string;
}

export interface EpProductInterface {
  id: string;
  type: "product";
  attributes: EpProductAttributes;
  meta: {
    catalog_id: string;
    catalog_source: "pim" | string;
    display_price?: EpDisplayPrice;
    original_display_price?: EpDisplayPrice;
    original_price?: {
      [key: string]: {
        amount: number;
        includes_tax: boolean;
      };
    };
    pricebook_id: string;
    tiers?: {
      [key: string]: {
        display_price?: EpDisplayPrice;
      };
    };
    variations?: EpVariationsInterface[];
    variation_matrix?: {
      [key: string]: {
        [key: string]: string;
      };
    };
    bread_crumbs?: Record<string, string[]>;
  };
  relationships: {
    files: {
      data: Array<{
        created_at: string;
        id: string;
        type: "file" | string;
      }>;
    };
    main_image: {
      data: {
        id: string;
        type: "main_image" | string;
      };
    };
    parent?: {
      data: {
        id: string;
        type: "product" | string;
      };
    };
  };
}

export interface EpVariationsInterface {
  id: string;
  name: string;
  options: Array<{
    description: string;
    id: string;
    name: string;
  }>;
}

export interface FlatProduct {
  connectorValue: string;
  image: string;
  imageFileId?: string;
  id: string;
  name: string;
  sku: string;
}

export interface ConfigurationParameters {
  projectKey?: string;
  clientId?: string;
  host?: string;
  productType?: string;
  pcmChannel?: string;
  pcmTag?: string;
  apiEndpoint?: string;
  itemsPerRequest?: number;
  itemsPerPage?: string;
  locale?: string;
  selectedValue?: string;
}

export enum EpFilterOperator {
  EQ = "eq",
  IN = "in",
}

export enum EpFilterAttribute {
  SKU = "sku",
  SLUG = "slug",
  NAME = "name",
}

export type BuildFilterProps = (
  values: string | string[],
  filterAttribute: EpFilterAttribute.SKU | EpFilterAttribute.NAME,
  filterOperator: EpFilterOperator.EQ | EpFilterOperator.IN
) => string;
