import React, { Component } from 'react'
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk'
import { getAllPCMProducts } from '../api/pcm'
import { ConfigurationParameters, FlatProduct } from '../interfaces'
import { fetchProductPreviews } from '../api/legacy'
import ProductGalleryPCM from './ProductGallery/ProductGalleryPCM'
import ProductGalleryLegacy from './ProductGallery/ProductGalleryLegacy'

interface DialogProps {
  sdk: DialogExtensionSDK
}

interface DialogState {
  productList: FlatProduct[]
}

class Dialog extends Component<DialogProps, DialogState> {
  state = {
    productList: [] as FlatProduct[],
    config: this.props.sdk.parameters.installation as ConfigurationParameters,
  }

  componentDidMount() {
    this.fetchProducts()
  }

  async getLegacyProducts() {
    return await fetchProductPreviews([], this.props.sdk.parameters.installation)
  }

  async getPCMProducts() {
    //PCM implicit API doesn't support filtering, so we need to fetch ALL pcm products and store in state
    return await getAllPCMProducts([], this.props.sdk.parameters.installation)
  }

  async fetchProducts() {
    const config = this.props.sdk.parameters.installation as ConfigurationParameters

    const { productType } = config
    let products =
      productType === 'product' ? await this.getLegacyProducts() : await this.getPCMProducts()

    this.setState(() => ({
      productList: products,
    }))
  }

  integrationType = (this.props.sdk.parameters.installation as ConfigurationParameters).productType

  render() {
    if (this.state.config.productType === 'product') {
      return <ProductGalleryLegacy productList={this.state.productList} sdk={this.props.sdk} />
    }

    //pcm product list
    return <ProductGalleryPCM allProductsList={this.state.productList} sdk={this.props.sdk} />
  }
}

export default Dialog
