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
    grant_type: "implicit",
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
export const getProducts = async ({
  filterAttribute,
  filterOperator,
  values,
}: {
  filterAttribute: EpFilterAttribute.SKU | EpFilterAttribute.NAME;
  filterOperator: EpFilterOperator.EQ | EpFilterOperator.IN;
  values: string | string[];
}) => {
  // TODO: init once
  const axiosClient = await initAxiosClient();

  const filterUrl = buildFilter(values, filterAttribute, filterOperator);

  console.log("filterUrl = ", filterUrl);

  // TODO: type?
  // EpCollectionResponse<EpProductInterface[]>
  const products: any = await axiosClient.get(
    `${EP_HOST}/pcm/catalog/products?filter=${filterUrl}`
  );

  console.log("getProducts() ? ", products);

  return products ? products.data : null;
};
