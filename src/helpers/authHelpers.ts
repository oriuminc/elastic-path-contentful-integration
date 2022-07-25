import Axios from 'axios';
import {EP_HOST} from "../constants";

const TOKEN_KEY = 'EP_CONNECTOR_TOKEN';

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function deleteToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function initAxiosInterceptors({ host }: any) {
  Axios.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }

    const hostUrl = `https://${host?.replace("https://", "")}`; //ensure host is prefixed with https://
    config.baseURL = hostUrl;

    return config;
  });

  // Axios.interceptors.response.use(
  //   function(response) {
  //     return response;
  //   },
  //   function(error) {
  //     if (error.response.status === 401) {
  //       deleteToken();
  //     } else {
  //       return Promise.reject(error);
  //     }
  //   }
  // );
}
