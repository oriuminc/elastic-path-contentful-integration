import { Moltin, PcmProduct, Product, ResourcePage } from '@moltin/sdk'
import { AxiosInstance } from 'axios'
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk'

export interface ConfigurationParameters {
  projectKey?: string
  clientId?: string
  host?: string
  productType?: string
  pcmChannel?: string
  pcmTag?: string
  apiEndpoint?: string
  itemsPerRequest?: number
  itemsPerPage?: string
  locale?: string
  selectedValue?: string
}

export interface FlatProduct {
  connectorValue: string
  image: string
  imageFileId?: string
  id: string
  name: string
  sku: string
}

export interface ProductWithImage extends ResourcePage<Product> {
  included: any
}

export interface PcmProductWithImage extends ResourcePage<PcmProduct, never> {
  included: any
}

export type PreviewsFn = (connectorValues: string[]) => Promise<FlatProduct[]>
export type DeleteFn = (index: number) => void
export type OnPageChanged = (paginationData: any, paginationObject: any) => void
export type Hash = Record<string, any>
export type SelectProductFn = (productId: string) => void

export interface FieldProps {
  sdk: FieldExtensionSDK
}

export interface ContextProps {
  sdk: FieldExtensionSDK
  config: ConfigurationParameters
  moltin: Moltin
  axiosClient: AxiosInstance
}
