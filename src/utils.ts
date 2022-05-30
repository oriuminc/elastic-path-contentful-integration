import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk'
import imagePlaceholder from './assets/image-placeholder.svg'

export const imageLoader = (imgPath: string) => {
  if (!imgPath || imgPath === '') {
    return imagePlaceholder
  }
  return imgPath
}

export const parseFieldValue = (sdk: FieldExtensionSDK) => {
  const _value: string | string[] = sdk.field.getValue()

  //filter out undefined from array
  return (Array.isArray(_value) ? _value : [_value]).filter((val) => val)
}

export const openDialog = async (
  sdk: FieldExtensionSDK,
  setConnectorValues: (data: any) => void,
) => {
  //get data from the Contentful app wrapper sdk
  const connectorValues: string[] = await sdk.dialogs.openCurrentApp({
    allowHeightOverflow: true,
    position: 'center',
    title: 'Select Product',
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: {
      ...sdk.parameters.installation,
      fieldValue: fieldValueToState(sdk.field.getValue()),
      fieldType: sdk.field.type,
      fieldId: sdk.field.id,
    },
    width: 1400,
    minHeight: 700,
  })

  if (connectorValues.length === 1 && connectorValues[0] === '') {
    await sdk.field.removeValue()
    setConnectorValues([])
  } else {
    if (sdk.field.type === 'Array') {
      await sdk.field.setValue(connectorValues)
      setConnectorValues(connectorValues)
    } else {
      await sdk.field.setValue(connectorValues[0])
      setConnectorValues(connectorValues) //we always want state to be an array of strings
    }
  }
}

const fieldValueToState = (value?: string | string[]): string[] => {
  if (!value) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}
