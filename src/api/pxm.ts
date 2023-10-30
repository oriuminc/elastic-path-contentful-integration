import axios from "axios";
import qs from "qs";

import { EP_HOST } from "../constants";
import {
  EpAccessTokenInterface,
  ImplicitToken,
  EpFilterOperator,
  EpFilterAttribute,
  BuildFilterProps,
} from "../types";

export const getAccessToken = async ({
  clientId,
  clientSecret,
  storeId,
}: any) => {
  const data = qs.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: clientSecret ? "client_credentials" : "implicit",
  });

  const headers = {
    "content-type": "text/plain",
  };

  try {
    const res = await axios.post<EpAccessTokenInterface<ImplicitToken>>(
      `${EP_HOST}/oauth/access_token`,
      data,
      {
        headers: {
          ...headers,
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.log("Error: get EP access token", error.message);
    throw error;
  }
};

const buildFilter: BuildFilterProps = (
  values,
  filterAttribute,
  filterOperator
) => {
  return `${filterOperator}(${filterAttribute},${
    Array.isArray(values) ? values.join(",") : values
  })`;
};

// TOOD: Typing and filter rules
export const getCatalogProducts = async ({
  filterAttribute,
  filterOperator,
  values,
  catalogTag = "",
  catalogChannel = "",
}: {
  filterAttribute:
    | EpFilterAttribute.SKU
    | EpFilterAttribute.NAME
    | EpFilterAttribute.ID;
  filterOperator: EpFilterOperator.EQ | EpFilterOperator.IN;
  values: string | string[];
  catalogTag?: string;
  catalogChannel?: string;
}) => {
  const filterUrl = buildFilter(values, filterAttribute, filterOperator);

  // TODO: type?
  // EpCollectionResponse<EpProductInterface[]>
  const products: any = await axios.get(
    `${EP_HOST}/pcm/catalog/products?filter=${filterUrl}&page[limit]=100&include=main_image`,
    {
      headers: {
        ...(catalogTag && { "EP-Context-Tag": catalogTag }),
        ...(catalogChannel && { "EP-Channel": catalogChannel }),
      },
    }
  );

  return products ? products.data : null;
};

export const getNextProductPage = async (url: string) => {
  const { data }: any = await axios.get(url);

  return data;
};

export const mapCatalogProductWithMainImages = (
  products: any,
  included: any
) => {
  const mainImagesById = included?.main_images.reduce(
    (obj: any, item: any) => Object.assign(obj, { [item.id]: { ...item } }),
    {}
  );

  return products
    ? products.map((product: any) => ({
        ...product.attributes,
        id: product.id,
        main_image: mainImagesById[product.relationships.main_image.data.id],
      }))
    : [];
};

// TOOD: Typing and filter rules
export const getProducts = async ({
  filterAttribute,
  value,
  limit = 10,
  offset = 0,
  catalogTag = "",
  catalogChannel = "",
}: {
  filterAttribute: EpFilterAttribute.SKU | EpFilterAttribute.NAME;
  value: string;
  limit?: number;
  offset?: number;
  catalogTag?: string;
  catalogChannel?: string;
}) => {
  let filterUrl;

  if (filterAttribute === EpFilterAttribute.SKU) {
    filterUrl = `${EpFilterOperator.EQ}(${filterAttribute},${value})`;
  } else {
    filterUrl = `${EpFilterOperator.LIKE}(${filterAttribute},${value})`;
  }

  const response: any = await axios.get(`${EP_HOST}/pcm/products`, {
    params: {
      filter: value ? filterUrl : undefined,
      "page[limit]": limit,
      "page[offset]": offset,
    },
    headers: {
      ...(catalogTag && { "EP-Context-Tag": catalogTag }),
      ...(catalogChannel && { "EP-Channel": catalogChannel }),
    },
  });

  return {
    products: response?.data?.data || [],
    total: response?.data?.meta?.results?.total || 0,
  };
};
