import { Moltin } from '@moltin/sdk'
import { AxiosInstance } from 'axios'
import { ConfigurationParameters, FlatProduct } from 'interfaces'
import { fetchSingleLegacyProduct } from './legacy'
import { fetchSinglePCMProductWithAxios } from './pcm'

export const filterMultipleProductsLegacy = async (
  connectorValues: string[],
  config: ConfigurationParameters,
  client: Moltin,
) => {
  const productList = await Promise.all(
    connectorValues.map(async (valueToFilter) =>
      fetchSingleLegacyProduct(valueToFilter, config, client),
    ),
  )

  //filter to remove nulls if EP fetch doesn't return data
  const sanitizedList = productList.filter((val) => val) as FlatProduct[]

  return sanitizedList
}

export const filterMultipleProductsPCM = async (
  connectorValues: string[],
  config: ConfigurationParameters,
  client: AxiosInstance,
) => {
  const productList = await Promise.all(
    connectorValues.map(async (valueToFilter) =>
      fetchSinglePCMProductWithAxios(valueToFilter, config, client),
    ),
  )

  //filter to remove nulls if EP fetch doesn't return data
  const sanitizedList = productList.filter((val) => val) as FlatProduct[]

  return sanitizedList
}

export const makeNotFound = (connectorValue: string) => {
  const notFound = `[Not Found] ${connectorValue}`

  return {
    connectorValue,
    image: '',
    id: notFound,
    name: notFound,
    sku: notFound,
  }
}
