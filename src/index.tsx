import React from 'react'
import { render } from 'react-dom'

import {
  AppExtensionSDK,
  BaseExtensionSDK,
  DialogExtensionSDK,
  FieldExtensionSDK,
  init,
  locations,
} from 'contentful-ui-extensions-sdk'
import '@contentful/forma-36-react-components/dist/styles.css'
import '@contentful/forma-36-fcss/dist/styles.css'
import './index.css'

import Config from './components/ConfigScreen'
import Field from './components/Field'
import Dialog from './components/Dialog'

if (process.env.NODE_ENV === 'development') {
  //if want to run locally, set these params and env variables to desired settings
  const parameters = {
    installation: {
      host: process.env.REACT_APP_EP_HOST,
      clientId: process.env.REACT_APP_EP_CLIENT_ID,
      productType: process.env.REACT_APP_EP_PRODUCT_TYPE, // pcm or product
      pcmChannel: process.env.REACT_APP_EP_CHANNEL,
      pcmTag: process.env.REACT_APP_EP_TAG,
      itemsPerPage: 24,
      selectedValue: process.env.REACT_APP_EP_CONNECTOR_VALUE, // id or sku
      itemsPerRequest: 100,
    },
  }
  const root = document.getElementById('root')
  render(<Dialog sdk={{ parameters } as any} />, root)
} else {
  init((sdk: BaseExtensionSDK) => {
    const root = document.getElementById('root')
    // All possible locations for your app
    // Feel free to remove unused locations
    // Dont forget to delete the file too :)
    const ComponentLocationSettings = [
      {
        location: locations.LOCATION_APP_CONFIG,
        component: <Config sdk={sdk as unknown as AppExtensionSDK} />,
      },
      {
        location: locations.LOCATION_ENTRY_FIELD,
        component: <Field sdk={sdk as unknown as FieldExtensionSDK} />,
      },
      {
        location: locations.LOCATION_DIALOG,
        component: <Dialog sdk={sdk as unknown as DialogExtensionSDK} />,
      },
    ]

    // Select a component depending on a location in which the app is rendered.
    //
    // NB: Location "app-config" is auto-included in the list as most apps need it
    // You can remove it (and on the app definition also) in case the app
    // doesn't require it
    ComponentLocationSettings.forEach((componentLocationSetting) => {
      if (sdk.location.is(componentLocationSetting.location)) {
        render(componentLocationSetting.component, root)
      }
    })
  })
}
