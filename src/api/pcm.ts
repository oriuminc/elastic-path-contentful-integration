import { ConfigurationParameters, FlatProduct } from '../interfaces'
import { Moltin, ProductResponse, ResourceList } from '@moltin/sdk'
import lodash from 'lodash'
import Bottleneck from 'bottleneck'

import initMoltinClient from '../lib/client'
import { makeNotFound } from './shared'
import { AxiosInstance } from 'axios'

/**
 * Note: This function is not being used due to lack of support of filtering or querying a product by id in the SDK.
 * Once this limition is resolved, this function can replace the axios REST call performed in fetchSinglePCMProductWithAxios
 *
 * @param connectorValue
 * @param config
 * @param client
 * @returns
 */
export async function fetchSinglePCMProduct(
  connectorValue: string,
  config: ConfigurationParameters,
  client: Moltin,
): Promise<FlatProduct | null> {
  const selectorValue = config.selectedValue ?? 'sku'
  try {
    const filter = {
      eq: { [selectorValue]: connectorValue },
    }
    const results = await client.Catalog.Products.With('main_image').Filter(filter).All()

    if (results.data.length === 0 || results.erorrs?.length > 0) {
      return makeNotFound(connectorValue)
    }

    return makeFlatProduct(results.data[0], selectorValue)
  } catch (err) {
    console.log(err)
    return makeNotFound(connectorValue)
  }
}

export async function fetchSinglePCMProductWithAxios(
  connectorValue: string,
  config: ConfigurationParameters,
  client: AxiosInstance,
): Promise<FlatProduct | null> {
  const selectorValue = config.selectedValue ?? 'sku'

  try {
    let url: string

    //need to use a different endpoint based on the selector: sku or id
    if (selectorValue === 'id') {
      url = `/pcm/catalog/products/${connectorValue}`
    } else {
      url = `/pcm/catalog/products?filter=eq(sku,${connectorValue})`
    }

    const result = await client.get(url)

    if (result.status !== 200) {
      return makeNotFound(connectorValue)
    }

    let product: ProductResponse

    if (Array.isArray(result.data.data)) product = result.data.data[0]
    else product = result.data.data

    return makeFlatProduct(product, selectorValue)
  } catch (err) {
    console.log(err)
    return makeNotFound(connectorValue)
  }
}

export async function getAllPCMProducts(
  connectorValues: string[],
  config: ConfigurationParameters,
): Promise<FlatProduct[]> {
  const client = await initMoltinClient(config)
  const list = await getProductList(client)
  const selectorValue = config.selectedValue ?? 'sku'

  const products = list.map((product) => makeFlatProduct(product, selectorValue))

  if (connectorValues.length > 0) {
    return products.filter((product) => connectorValues.includes(product.connectorValue))
  }

  return products
}

/**
 * There is a known issue on the EP PCM api that it does not support filtering by LIKE, only supports EQ.
 * Until this is resolved the strategy for PCM integration is to fetch all products and store locally and then
 * perform filtering in local memory.
 *
 * @param client
 * @param filter
 * @returns List of PCM products from /pcm/catalog api
 *
 * @
 */
async function getProductList(client: Moltin): Promise<ProductResponse[]> {
  const limit = 25 // EP default max
  let itemsRetrieved = 0
  let totalProducts = 0
  let batchList: Promise<ResourceList<ProductResponse>>[] = []
  let list: ProductResponse[] = []

  const limiter = new Bottleneck({ minTime: 300, maxConcurrent: 20 })

  const firstQuery = await client.Catalog.Products.Limit(limit).Offset(itemsRetrieved).All()

  list.push(...firstQuery?.data)
  // @ts-ignore
  totalProducts = firstQuery.meta.results.total

  if (limit <= totalProducts) {
    for (let itemsRetrieved = limit; itemsRetrieved < totalProducts; itemsRetrieved += limit) {
      batchList.push(
        limiter.schedule(() => client.Catalog.Products.Limit(limit).Offset(itemsRetrieved).All()),
      )
    }
    const result = await Promise.all(batchList)
    list = list.concat(result.map((productResponse) => productResponse.data).flat(1))
  }

  return list
}

const makeFlatProduct = (product: ProductResponse, selectorValue: string) => {
  const image = lodash.get(product, 'relationships.main_image.data.link.href')
  const flatProduct = {
    id: product.id,
    name: product.attributes.name,
    connectorValue: selectorValue === 'sku' ? product.attributes.sku : product.id,
    image,
    imageFileId: product?.relationships?.main_image?.data?.id,
    sku: product.attributes.sku,
  } as FlatProduct

  return flatProduct
}
