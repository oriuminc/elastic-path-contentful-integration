import React, { useContext, useEffect, useState } from 'react'
import arrayMove from 'array-move'
import { FlatProduct } from '../../interfaces'

import PreviewList from './PreviewList'
import './product-preview.css'

import { filterMultipleProductsLegacy, filterMultipleProductsPCM } from 'api/shared'
import { PreviewContext } from 'components/Field'

interface ProductPreviewProps {
  connectorValues: string[]
  className: string
  setConnectorValues: (data: any) => void
}

const ProductsPreview = ({
  connectorValues,
  className,
  setConnectorValues,
}: ProductPreviewProps) => {
  const { sdk, config, axiosClient, moltin } = useContext(PreviewContext)
  const [productList, setProductList] = useState<FlatProduct[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!(moltin && axiosClient)) return

    let getProducts: () => void

    if (config.productType === 'pcm') {
      getProducts = async () => {
        const results = await filterMultipleProductsPCM(connectorValues, config, axiosClient)

        setProductList(results)
        setLoading(false)
      }
    } else {
      getProducts = async () => {
        const results = await filterMultipleProductsLegacy(connectorValues, config, moltin)

        setProductList(results)
        setLoading(false)
      }
    }

    getProducts()
  }, [connectorValues, moltin, axiosClient, config])

  const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    const newConnectorValues = arrayMove(connectorValues, oldIndex, newIndex)
    sdk.field.setValue(newConnectorValues)
    setConnectorValues(newConnectorValues)
    setLoading(true)
  }

  const deleteItem = (index: number) => {
    const newConnectorValues = [...connectorValues]
    newConnectorValues.splice(index, 1)
    if (newConnectorValues.length > 0) {
      sdk.field.setValue(newConnectorValues)
    } else {
      sdk.field.removeValue() //remove if no values left in the array
    }
    setLoading(true)
    setConnectorValues(newConnectorValues)
  }

  if (productList.length === 0 || loading) {
    return null
  }

  return (
    <div className={className}>
      <PreviewList
        onSortStart={(_: any, e: any) => e.preventDefault()} // Fixes FF glitches.
        onSortEnd={onSortEnd}
        axis="xy"
        deleteFn={deleteItem}
        productPreviews={productList}
        useDragHandle
      />
    </div>
  )
}

export default ProductsPreview
