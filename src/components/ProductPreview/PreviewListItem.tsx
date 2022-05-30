import React, { useContext } from 'react'
import { SortableElement, SortableHandle } from 'react-sortable-hoc'
import {
  Card,
  CardDragHandle as FormaCardDragHandle,
  Heading,
  IconButton,
  Subheading,
  Typography,
} from '@contentful/forma-36-react-components'
import { imageLoader } from '../../utils'
import { FlatProduct } from '../../interfaces'
import { useProductImageUrl } from '../../hooks/useProductImageUrl'
import { PreviewContext } from 'components/Field'

interface ProductItemProps {
  product: FlatProduct
  onDelete: () => void
  isSortable: boolean
}

const CardDragHandle = SortableHandle(() => (
  <FormaCardDragHandle className="ep-card-handler">Reorder product</FormaCardDragHandle>
))

const PreviewListItem = SortableElement<ProductItemProps>(
  ({ product, isSortable, onDelete }: ProductItemProps) => {
    const { moltin } = useContext(PreviewContext)
    const { imageUrl } = useProductImageUrl(moltin, product)

    const displayLabel = product.name || product.sku

    return (
      <Card className="ep-preview-wrapper" key={`${product.id}-${product.connectorValue}`}>
        {isSortable && <CardDragHandle />}
        <div className="ep-preview-image-wrapper">
          <img className="ep-preview-image" src={imageLoader(imageUrl)} alt={displayLabel} />
        </div>
        <section className="ep-preview-section">
          <Typography>
            <Heading className="ep-preview-name">{displayLabel}</Heading>
            <Subheading className="ep-preview-connectorValue">{product.connectorValue}</Subheading>
          </Typography>
        </section>
        <div className="ep-product-item-actions">
          <IconButton
            label="Delete"
            iconProps={{ icon: 'Close' }}
            {...{
              buttonType: 'muted',
              onClick: onDelete,
            }}
          />
        </div>
      </Card>
    )
  },
)

export default PreviewListItem
