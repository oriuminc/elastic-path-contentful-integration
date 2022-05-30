import { gateway } from '@moltin/sdk'
import axios from 'axios'
import qs from 'qs'
import { ConfigurationParameters } from '../interfaces'

const initMoltinClient = async (config: ConfigurationParameters) => {
  const headers =
    config.productType === 'pcm'
      ? {
          ...(config.pcmChannel ? { 'EP-Channel': config.pcmChannel } : {}),
          ...(config.pcmTag ? { 'EP-Context-Tag': config.pcmTag } : {}),
        }
      : {}

  const client = gateway({
    client_id: config.clientId,
    host: config.host?.replace('https://', ''), //the sdk auto prepends 'https://'
    headers,
  })
  await client.Authenticate()

  return client
}

export default initMoltinClient

export const initAxiosClient = async (config: ConfigurationParameters) => {
  const axiosClient = axios.create()

  const hostUrl = `https://${config.host?.replace('https://', '')}` //ensure host is prefixed with https://

  axiosClient.defaults.baseURL = hostUrl

  const result = await axiosClient.post(
    `/oauth/access_token`,
    qs.stringify({ client_id: config.clientId, grant_type: 'implicit' }),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  )
  const access_token = result.data.access_token || ''

  const authHeader = { Authorization: `Bearer: ${access_token}` }
  const catalogHeaders =
    config.productType === 'pcm'
      ? {
          ...(config.pcmChannel ? { 'EP-Channel': config.pcmChannel } : {}),
          ...(config.pcmTag ? { 'EP-Context-Tag': config.pcmTag } : {}),
        }
      : {}

  axiosClient.defaults.headers.common = { ...catalogHeaders, ...authHeader }

  return axiosClient
}
