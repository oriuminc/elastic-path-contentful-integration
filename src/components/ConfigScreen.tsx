import React, { Component } from 'react'
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk'
import {
  Form,
  Heading,
  Option,
  Paragraph,
  SelectField,
  TextField,
  Workbench,
} from '@contentful/forma-36-react-components'
import { css } from 'emotion'

export interface AppInstallationParameters {
  storeId: string
  clientId: string
  host: string
  productType: 'product' | 'pcm'
  selectedValue: 'sku' | 'id'
  itemsPerRequest: number
  itemsPerPage: number
  pcmChannel?: string
  pcmTag?: string
}

interface ConfigProps {
  sdk: AppExtensionSDK
}

interface ConfigState {
  parameters: AppInstallationParameters
}

const DEFAULT_ITEMS_PAGE = 100
const DEFAULT_ITEMS_PER_PAGE = 24

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props)
    this.state = {
      parameters: {
        storeId: '',
        clientId: '',
        host: 'api.moltin.com',
        productType: 'product',
        selectedValue: 'sku',
        itemsPerRequest: DEFAULT_ITEMS_PAGE,
        itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
        pcmChannel: '',
        pcmTag: '',
      },
    }

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure())
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null = await this.props.sdk.app.getParameters()

    this.setState(parameters ? { parameters } : this.state, () => {
      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      this.props.sdk.app.setReady()
    })
  }

  onParameterChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget

    this.setState((state) => ({
      parameters: { ...state.parameters, [key]: value },
    }))
  }

  onConfigure = async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await this.props.sdk.app.getCurrentState()

    return {
      // Parameters to be persisted as the app configuration.
      parameters: this.state.parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    }
  }

  render() {
    return (
      <Workbench className={css({ margin: '80px' })}>
        <Form>
          <Heading>App Config</Heading>
          <Paragraph>
            Enter your Elastic Path configuration in order to fetch products to be linked on your
            content.
          </Paragraph>
          <TextField
            required
            name="clientId"
            id="clientId"
            value={this.state.parameters.clientId || ''}
            onChange={this.onParameterChange.bind(this, 'clientId')}
            labelText="Elastic Path Client ID"
            helpText="Copy your Elastic Path Client ID and enter it here."
          />
          <TextField
            required
            name="host"
            id="host"
            value={this.state.parameters.host || 'api.moltin.com'}
            onChange={this.onParameterChange.bind(this, 'host')}
            labelText="Elastic Path host url"
            helpText="Copy your Elastic Path host url and enter it here."
          />
          <SelectField
            required
            id="productType"
            name="productType"
            labelText="Products Type"
            onChange={this.onParameterChange.bind(this, 'productType')}
            helpText="Select the ElasticPath Product catalog to pull from, legacy or pcm."
            value={this.state.parameters.productType || 'product'}
          >
            <Option value="product">product (legacy)</Option>
            <Option value="pcm">pcm</Option>
          </SelectField>
          {this.state.parameters.productType === 'pcm' && (
            <>
              <TextField
                required
                name="pcmChannel"
                id="pcmChannel"
                value={this.state.parameters.pcmChannel || ''}
                onChange={this.onParameterChange.bind(this, 'pcmChannel')}
                labelText="PCM Catalog Rule Channel"
                helpText="Set the channel to set what PCM catalog to query from. See your Catalog Rules for configued channels"
              />
              <TextField
                required
                name="pcmTag"
                id="pcmTag"
                value={this.state.parameters.pcmTag || ''}
                onChange={this.onParameterChange.bind(this, 'pcmTag')}
                labelText="PCM Catalog Rule Tag "
                helpText="Set the tag to set what PCM catalog to query from. See your Catalog Rules for configued tags."
              />
            </>
          )}
          <SelectField
            required
            id="selectedValue"
            name="selectedValue"
            labelText="connector Value Type"
            onChange={this.onParameterChange.bind(this, 'selectedValue')}
            helpText="Choose whether Contentful stores the product Id, or SKU, of products selected through this integration."
            value={this.state.parameters.selectedValue || 'sku'}
          >
            <Option value="sku">sku</Option>
            <Option value="id">id</Option>
          </SelectField>
          <TextField
            required
            name="itemsPerRequest"
            id="itemsPerRequest"
            value={
              this.state.parameters.itemsPerRequest
                ? this.state.parameters.itemsPerRequest.toString()
                : `${DEFAULT_ITEMS_PAGE}`
            }
            onChange={this.onParameterChange.bind(this, 'itemsPerRequest')}
            labelText="Items fetched per request (legacy catalog integration only)"
            helpText="Number of products fetched from Elastic Path during product fetching."
          />
          <TextField
            required
            name="itemsPerPage"
            id="itemsPerPage"
            value={
              this.state.parameters.itemsPerPage
                ? this.state.parameters.itemsPerPage.toString()
                : `${DEFAULT_ITEMS_PER_PAGE}`
            }
            onChange={this.onParameterChange.bind(this, 'itemsPerPage')}
            labelText="Products per page"
            helpText="Number of items displayed on product selection page."
          />
        </Form>
      </Workbench>
    )
  }
}
