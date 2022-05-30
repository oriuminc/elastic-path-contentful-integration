import { ConfigurationParameters, FlatProduct, ProductWithImage } from '../interfaces'
import { Category, Collection, Moltin, Product } from '@moltin/sdk'

import initMoltinClient from '../lib/client'
import { makeNotFound } from './shared'

function makeFlatProducts(listOfProducts: ProductWithImage, selectedValue: string): FlatProduct[] {
  const flatProducts: FlatProduct[] = []
  for (const product of listOfProducts.data) {
    let newFlatProduct = {
      id: product.id,
      name: product.name,
      connectorValue: selectedValue === 'sku' ? product.sku : product.id,
      imageFileId: product?.relationships?.main_image?.data?.id,
      image: listOfProducts.included
        ? getImageForProduct(product, listOfProducts.included?.main_images)
        : null,
      sku: product.sku,
    } as FlatProduct
    flatProducts.push(newFlatProduct)
  }
  return flatProducts
}

function getImageForProduct(product: Product, included: any[]): string | null {
  const mainImage = included.find((main_image: any) => {
    const relationshipId = product.relationships?.main_image
      ? product.relationships?.main_image?.data?.id
      : null

    return main_image.id === relationshipId
  })
  return mainImage ? mainImage.link.href : ''
}

function getStatusFilter(config: ConfigurationParameters): object {
  return {}
}

function createFilters(
  config: ConfigurationParameters,
  searchTerm: string | null,
  category: string | null,
  collection: string | null,
) {
  let filters = getStatusFilter(config)
  let eqFilters = {}

  if (searchTerm && searchTerm !== '') {
    let terms = searchTerm.replace(/[^\w\-\s]+/i, '')
    terms = encodeURI(`*${searchTerm}*`)
    filters = {
      ...filters,
      like: { sku: terms },
    }
  }

  if (category && category !== '') {
    eqFilters = {
      ...eqFilters,
      category: {
        id: category,
      },
    }
  }

  if (collection && collection !== '') {
    eqFilters = {
      ...eqFilters,
      collection: {
        id: collection,
      },
    }
  }

  filters = {
    ...filters,
    eq: { ...eqFilters },
  }
  return filters
}

export const fetchProductPreviews = async (
  connectorValues: string[],
  config: ConfigurationParameters,
): Promise<FlatProduct[]> => {
  return fetchProduct(connectorValues, config)
}

export async function fetchProduct(
  connectorValues: string[],
  config: ConfigurationParameters,
): Promise<FlatProduct[]> {
  const client = await initMoltinClient(config)

  const itemsPerRequest = config.itemsPerRequest ?? 0

  const list = (await client.Products.With('main_images')
    .Limit(itemsPerRequest)
    .Sort('created_at')
    .All()) as ProductWithImage

  const products = makeFlatProducts(list, config.selectedValue ?? 'sku')
  if (connectorValues.length > 0) {
    return products.filter((product) => connectorValues.includes(product.connectorValue))
  }

  return products
}
export async function fetchSingleLegacyProduct(
  connectorValue: string,
  config: ConfigurationParameters,
  client: Moltin,
): Promise<FlatProduct | null> {
  try {
    const result = (await client.Products.With('main_images')
      .Filter({ eq: { [config.selectedValue!]: connectorValue } })
      .All()) as ProductWithImage
    const products = makeFlatProducts(result, config.selectedValue ?? 'sku')

    if (products.length === 0) {
      return makeNotFound(connectorValue)
    }

    return products[0]
  } catch (err) {
    console.log(err)
    return makeNotFound(connectorValue)
  }
}

export async function searchClassicProducts(
  searchTerm: string,
  category: string | null,
  collection: string | null,
  config: ConfigurationParameters,
): Promise<FlatProduct[]> {
  const client = await initMoltinClient(config)
  let products: ProductWithImage
  const itemsPerRequest = config.itemsPerRequest ?? 0

  products = (await client.Products.With('main_images')
    .Filter({
      ...createFilters(config, searchTerm, category, collection),
    })
    .Limit(itemsPerRequest)
    .Sort('created_at')
    .All()) as ProductWithImage

  return makeFlatProducts(products, config.selectedValue ?? 'sku')
}

export async function searchProducts(
  searchTerm: string,
  category: string | null,
  collection: string | null,
  config: ConfigurationParameters,
): Promise<FlatProduct[]> {
  return searchClassicProducts(searchTerm, category, collection, config)
}

export async function getCategories(config: ConfigurationParameters): Promise<Category[]> {
  const client = await initMoltinClient(config)
  const categories = await client.Categories.Sort('created_at').All()
  return categories.data
}

export async function getCollections(config: ConfigurationParameters): Promise<Collection[]> {
  const client = await initMoltinClient(config)
  const categories = await client.Collections.Sort('created_at').All()
  return categories.data
}
