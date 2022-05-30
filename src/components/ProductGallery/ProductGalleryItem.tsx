import React from 'react'
import noop from 'lodash/noop'
import { Moltin } from '@moltin/sdk'
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk'
import { FlatProduct, SelectProductFn } from '../../interfaces'
import { imageLoader } from '../../utils'
import { useProductImageUrl } from '../../hooks/useProductImageUrl'

interface ProductGalleryDetailProps {
  product: FlatProduct
  sdk: DialogExtensionSDK
  selectedProducts: string[]
  onSelectProduct: SelectProductFn
  moltin: Moltin | null
}

const ProductGalleryItem = ({
  onSelectProduct,
  product,
  selectedProducts,
  moltin,
}: ProductGalleryDetailProps) => {
  const isSelected = selectedProducts.includes(product.connectorValue)
  const { imageUrl } = useProductImageUrl(moltin, product)

  const onSelect = (connectorValue: string) => {
    if (!onSelectProduct) {
      return
    }

    onSelectProduct(connectorValue)
  }

  const displayLabel = product.name || product.sku

  return (
    <div className="ep-product-wrapper">
      <div
        data-test-id={`product-preview-${product.connectorValue}`}
        role="switch"
        aria-checked={isSelected}
        tabIndex={-1}
        className={`ep-product ${isSelected ? 'ep-selected-product' : ''}`}
        onKeyUp={noop}
        onClick={() => onSelect(product.connectorValue)}
      >
        <div className="ep-product-image-wrapper">
          <img
            style={{ display: 'block' }}
            src={imageLoader(imageUrl)}
            alt="product preview"
            className="ep-product-image-preview"
            data-test-id="image"
          />
        </div>
        <p className="ep-product-name">{displayLabel}</p>
        <p className="ep-product-connectorValue">{product.connectorValue}</p>
      </div>
    </div>
  )
}

export default ProductGalleryItem
