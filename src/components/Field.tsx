import React, { useEffect, useState, useContext } from 'react'
import { Button } from '@contentful/forma-36-react-components'
import { AxiosInstance } from 'axios'

import ProductsPreview from './ProductPreview/ProductsPreview'
import logo from '../logo.svg'
import { ConfigurationParameters, ContextProps, FieldProps } from 'interfaces'
import { Moltin } from '@moltin/sdk'
import initMoltinClient, { initAxiosClient } from 'lib/client'
import { openDialog, parseFieldValue } from 'utils'

export const PreviewContext = React.createContext<ContextProps>({} as ContextProps)

const Field: React.FunctionComponent<FieldProps> = ({ sdk }) => {
  const config = sdk.parameters.installation as ConfigurationParameters
  const [clients, setClients] = useState<{
    moltin: Moltin | null
    axiosClient: AxiosInstance | null
  }>({ moltin: null, axiosClient: null })

  useEffect(() => {
    const getClients = async () => {
      try {
        //prevent re-initialization if re-rendering
        if (clients.axiosClient && clients.moltin) return

        const getMoltin = initMoltinClient(config)
        const getAxios = initAxiosClient(config)

        const [moltin, axiosClient] = await Promise.all([getMoltin, getAxios])

        setClients({ moltin, axiosClient })
      } catch (err) {
        console.log(err)
      }
    }
    getClients()
  }, [config, clients.axiosClient, clients.moltin])

  const { axiosClient, moltin } = clients

  if (!moltin || !axiosClient) {
    return null
  }

  return (
    <PreviewContext.Provider value={{ sdk, moltin, config, axiosClient }}>
      <FieldScene />
    </PreviewContext.Provider>
  )
}

const FieldScene = () => {
  const { sdk } = useContext(PreviewContext)

  //unfortunately we need to use state here to store the list of products from the sdk for re-rendering when an item is removed or rearranged
  const [connectorValues, setConnectorValues] = useState(parseFieldValue(sdk))

  const connectorValuesLength = connectorValues.length

  useEffect(() => {
    sdk.window.updateHeight((connectorValuesLength + 1) * 90)
  }, [connectorValuesLength, sdk.window])

  return (
    <div className="ep-product-preview-wrapper">
      {connectorValues.length > 0 && (
        <ProductsPreview
          connectorValues={connectorValues}
          className="ep-product-preview"
          setConnectorValues={setConnectorValues}
        />
      )}
      <div className="ep-connector-container">
        <img src={logo} alt="Logo" className="ep-logo" />
        <Button
          icon="ShoppingCart"
          buttonType="muted"
          size="small"
          onClick={() => openDialog(sdk, setConnectorValues)}
        >
          {sdk.field.type !== 'Array' ? 'Select product' : 'Select products'}
        </Button>
      </div>
    </div>
  )
}

export default Field
