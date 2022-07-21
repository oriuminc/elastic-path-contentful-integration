import axios, { AxiosInstance } from "axios";
import { AnyARecord } from "dns";
import qs from "qs";

import {
  EP_HOST,
  EP_CLIENT_ID,
  ELASTIC_PATH_DEFAULT_CHANNEL,
} from "../constants";
import {
  EpCollectionResponse,
  FlatProduct,
  EpProductInterface,
  EpAccessTokenInterface,
  ImplicitToken,
  EpFilterOperator,
  EpFilterAttribute,
  BuildFilterProps,
} from "../types";

export const getAccessToken = async (clientId: string, storeId?: string) => {
  const data = qs.stringify({
    client_id: clientId,
    client_secret: "EguPENTOwP5lbiFhB7f995bsqqPPcEK3m7OZgfoFpf",
    grant_type: "client_credentials",
  });
  const headers = {
    "content-type": "text/plain",
  };

  try {
    const res = await axios.post<EpAccessTokenInterface<ImplicitToken>>(
      `${EP_HOST}/oauth/access_token`,
      data,
      {
        headers,
      }
    );
    return res.data;
  } catch (error: any) {
    console.log("Error: get EP access token", error.message);
    throw error;
  }
};

export const initAxiosClient = async (epChannel?: string) => {
  const axiosClient = axios.create();

  const hostUrl = `https://${EP_HOST?.replace("https://", "")}`; //ensure host is prefixed with https://

  axiosClient.defaults.baseURL = hostUrl;
  // TODO: store accessToken to localstorage and refresh if expired
  const access_token = await getAccessToken(EP_CLIENT_ID);
  const authHeader = {
    Authorization: `${access_token.token_type} ${access_token.access_token}`,
  };
  const catalogHeaders = {
    "EP-Channel": epChannel ?? ELASTIC_PATH_DEFAULT_CHANNEL,
  };

  // set defaults header
  axiosClient.defaults.headers.common = { ...catalogHeaders, ...authHeader };

  return axiosClient;
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
  catalog = ''
}: {
  filterAttribute: EpFilterAttribute.SKU | EpFilterAttribute.NAME;
  filterOperator: EpFilterOperator.EQ | EpFilterOperator.IN;
  values: string | string[];
  catalog?: string;
}) => {
  // TODO: init once
  const axiosClient = await initAxiosClient(catalog);

  const filterUrl = buildFilter(values, filterAttribute, filterOperator);

  console.log("filterUrl = ", filterUrl);

  // TODO: type?
  // EpCollectionResponse<EpProductInterface[]>
  const products: any = await axiosClient.get(
    `${EP_HOST}/pcm/catalog/products?filter=${filterUrl}&include=main_image`
  );

  console.log("getProducts() ? ", products);

  return products ? products.data : null;
};


export const mapCatalogProductWithMainImages = (products: any, included: any) => {
  const mainImagesById = included.main_images.reduce(
    (obj: any, item: any) => Object.assign(obj, { [item.id]: {...item} }), {}
  );

  return products ? products.map(
    (product: any) => ({
      ...product.attributes,
      id: product.id,
      main_image: mainImagesById[product.relationships.main_image.data.id]
    })
  ) : [];
}

// TOOD: Typing and filter rules
export const getProducts = async ({
                                    filterAttribute,
                                    value
}: {
  filterAttribute: EpFilterAttribute.SKU | EpFilterAttribute.NAME;
  value: string
}) => {
  let filterUrl;

  if (filterAttribute === EpFilterAttribute.SKU) {
    filterUrl = `${EpFilterOperator.EQ}(${filterAttribute},${value})`;
  } else {
    filterUrl = `${EpFilterOperator.LIKE}(${filterAttribute},${value})`;
  }

  // TODO: type?
  // EpCollectionResponse<EpProductInterface[]>
  const products: any = await getProductsFromUrl(
    `${EP_HOST}/pcm/products?filter=${filterUrl}`,
      []
  );

  console.log("getProducts() ? ", products);

  return products ? products : [];
};

// @ts-ignore
export const getProductsFromUrl = async (url: string, products: any[]) => {
  try {
    const axiosClient = await initAxiosClient();
    const { data }: any = await axiosClient.get(url);
    if (data &&
      data.links &&
      (data.links.next || data.links.last)) {
      return await getProductsFromUrl(data.links.next || data.links.last, [...products, ...data.data]);
    } else {
      return [...products, ...data.data];
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};


export const getFile = async (id: string) => {
  // TODO: init once
  const axiosClient = await initAxiosClient();

  // TODO: type?
  // EpCollectionResponse<EpProductInterface[]>
  const file: any = await axiosClient.get(
    `${EP_HOST}/v2/files/${id}`
  );

  console.log("getFile() ? ", file);

  return file ? file.data : null;
};