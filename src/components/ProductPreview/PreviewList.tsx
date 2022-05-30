import React from 'react'
import { DeleteFn, FlatProduct } from '../../interfaces'
import { SortableContainer } from 'react-sortable-hoc'
import PreviewListItem from './PreviewListItem'

export interface ProductDetailProps {
  productPreviews: FlatProduct[]
  deleteFn: DeleteFn
}

const PreviewList = SortableContainer<ProductDetailProps>(
  ({ deleteFn, productPreviews }: ProductDetailProps) => {
    const itemsAreSortable = productPreviews.length > 1
    return (
      <div>
        {productPreviews.map((product, index) => {
          return (
            <PreviewListItem
              key={`${product.id}-${product.connectorValue}`}
              product={product}
              onDelete={() => deleteFn(index)}
              isSortable={itemsAreSortable}
              index={index}
            />
          )
        })}
      </div>
    )
  },
)

export default PreviewList
