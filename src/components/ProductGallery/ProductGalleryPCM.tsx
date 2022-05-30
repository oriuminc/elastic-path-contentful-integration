import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { FlatProduct, Hash } from '../../interfaces'
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk'
import ProductGalleryItem from './ProductGalleryItem'
import { debounce } from 'lodash'
import { Button, Icon, TextInput } from '@contentful/forma-36-react-components'
import './product-gallery.css'

import { Moltin } from '@moltin/sdk'
import initMoltinClient from 'lib/client'
import { usePagination } from 'hooks/usePagination'
const isProd = process.env.NODE_ENV === 'production'

interface ProductGalleryProps {
  allProductsList: FlatProduct[]
  sdk: DialogExtensionSDK
}

const ITEMS_PER_PAGE = 24

const ProductGalleryPCM: FunctionComponent<ProductGalleryProps> = ({ allProductsList, sdk }) => {
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false)

  const [productList, setProductList] = useState<FlatProduct[]>(allProductsList)
  const [searchTerm, setSearchTerm] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [moltin, setMoltin] = useState<Moltin>()

  //init fuzzy search with Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(allProductsList, { keys: ['name', 'sku'], minMatchCharLength: 1, threshold: 0.4 }),
    [allProductsList],
  )

  useEffect(() => {
    let fieldType = 'Array'
    let fieldValue = []

    if (isProd) {
      const invocation = sdk.parameters.invocation as Hash
      fieldType = invocation.fieldType
      fieldValue = invocation.fieldValue
    }

    setSelectedProducts(fieldValue) //string[] of productID or SKUs
    setAllowMultipleSelection(fieldType === 'Array')

    const setClient = async () => {
      const client = await initMoltinClient(sdk.parameters.installation)
      setMoltin(client)
    }
    setClient()
  }, [sdk])

  useEffect(() => {
    const filteredProducts = searchTerm
      ? fuse.search(searchTerm).map((found) => found.item)
      : allProductsList

    setProductList(filteredProducts)
  }, [searchTerm, allProductsList, fuse])

  const debouncedSearchByTerm = useMemo(
    () =>
      debounce((searchTerm: string) => {
        setSearchTerm(searchTerm)
        setCurrentPage(1)
      }, 300),
    [],
  )

  const pageinationRange = usePagination({
    currentPage,
    pageSize: ITEMS_PER_PAGE,
    totalCount: productList.length,
    siblingCount: 1,
  })

  const onPageChanged = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const onSelectProduct = (connectorValue: string) => {
    //process single product selection cases
    if (!allowMultipleSelection) {
      if (selectedProducts[0] === connectorValue) {
        return setSelectedProducts([])
      }

      return setSelectedProducts([connectorValue])
    }

    //process multiple selection cases
    let newSelectedProducts: string[]
    if (selectedProducts.includes(connectorValue)) {
      newSelectedProducts = [...selectedProducts].filter((item) => item !== connectorValue)
    } else {
      newSelectedProducts = [...selectedProducts, connectorValue]
    }

    return setSelectedProducts(newSelectedProducts)
  }

  const saveSelected = () => {
    sdk.close(selectedProducts)
  }
  const clearSavedProducts = () => {
    sdk.close([])
  }

  const saveButtonLabel = () => {
    const totalSelected = selectedProducts.length
    switch (totalSelected) {
      case 0:
        return 'Save (No products Selected)'
      case 1:
        return 'Save 1 product'
      default:
        return `Save ${totalSelected} products`
    }
  }

  const lastPageNum = pageinationRange[pageinationRange.length - 1]
  const productListToDisplay = productList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <>
      <header className="ep-gallery-header">
        <div className="ep-gallery-controls">
          <TextInput
            placeholder="Search by SKU..."
            type="search"
            name="connectorValue-search"
            id="connectorValue-search"
            testId="connectorValue-search"
            value=""
            width="medium"
            className="ep-gallery-search-box"
            onInput={(event) => debouncedSearchByTerm((event.target as HTMLInputElement).value)}
          />
          <Icon color="muted" icon="Search" className="ep-gallery-search-icon" />
        </div>

        <>
          <div className="ep-gallery-controls-right">
            <Button className="control" buttonType="primary" onClick={clearSavedProducts}>
              {'Clear'}
            </Button>
            <Button
              className="control"
              buttonType="primary"
              onClick={saveSelected}
              disabled={selectedProducts.length === 0}
            >
              {allowMultipleSelection ? saveButtonLabel() : 'Save'}
            </Button>
          </div>
        </>
      </header>
      <section>
        <div className="ep-gallery-list">
          {productList.length > 0 &&
            productListToDisplay.map((product, index) => {
              return (
                <ProductGalleryItem
                  product={product}
                  selectedProducts={selectedProducts}
                  onSelectProduct={onSelectProduct}
                  sdk={sdk}
                  moltin={moltin!}
                  key={index}
                />
              )
            })}
        </div>

        <nav aria-label="Pages">
          <ul className="ep-pagination">
            <li className={`page-item`}>
              <Button
                buttonType={'muted'}
                size="small"
                onClick={() => onPageChanged(currentPage > 1 ? currentPage - 1 : currentPage)}
              >
                {'<'}
              </Button>
            </li>
            {pageinationRange.map((pageNum) => {
              if (pageNum === -888 || pageNum === -999) {
                return (
                  <li key={pageNum} className={`page-item`}>
                    {'...'}
                  </li>
                )
              }

              return (
                <li
                  key={pageNum}
                  className={`page-item${currentPage === pageNum ? ' active' : ''}`}
                >
                  <Button
                    buttonType={currentPage === pageNum ? 'primary' : 'muted'}
                    size="small"
                    onClick={() => onPageChanged(pageNum)}
                  >
                    {pageNum}
                  </Button>
                </li>
              )
            })}
            <li className={`page-item`}>
              <Button
                buttonType={'muted'}
                size="small"
                onClick={() =>
                  onPageChanged(currentPage < lastPageNum ? currentPage + 1 : currentPage)
                }
              >
                {'>'}
              </Button>
            </li>
          </ul>
        </nav>
      </section>
    </>
  )
}

export default ProductGalleryPCM
