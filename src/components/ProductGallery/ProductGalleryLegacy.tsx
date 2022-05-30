import React, { Component } from 'react'
import { ConfigurationParameters, FlatProduct, Hash } from '../../interfaces'
import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk'
import ProductGalleryItem from './ProductGalleryItem'
import {
  Button,
  EmptyState,
  Icon,
  Option,
  Select,
  TextInput,
} from '@contentful/forma-36-react-components'
import './product-gallery.css'
import { getCategories, getCollections, searchProducts } from '../../api/legacy'
import Pagination from './Pagination'
import { Category, Collection, gateway, Moltin } from '@moltin/sdk'

const isProd = process.env.NODE_ENV === 'production'

interface ProductGalleryProps {
  productList: FlatProduct[]
  sdk: DialogExtensionSDK
}

interface ProductGalleryState {
  productList: FlatProduct[]
  searchTerm: string | null
  searchCategoryId: string | null
  searchCollectionId: string | null
  searchCategories: Category[]
  searchCollections: Collection[]
  offsetItems: number
  currentPage: number
  loading: boolean
  paginationObject: object
  selectedProducts: string[]
  moltin: Moltin | null
}

let ITEMS_PER_PAGE = 24
const SEARCH_WAIT_TIME = 300

class ProductGalleryLegacy extends Component<ProductGalleryProps, ProductGalleryState> {
  private allowMultipleSelection: boolean = false
  private searchTimout: any

  state = {
    productList: [] as FlatProduct[],
    searchTerm: '',
    searchCategoryId: '',
    searchCollectionId: '',
    searchCategories: [] as Category[],
    searchCollections: [] as Collection[],
    offsetItems: 0,
    currentPage: 1,
    loading: true,
    paginationObject: {} as Pagination,
    selectedProducts: [] as string[],
    moltin: null,
  }

  componentDidMount() {
    let fieldType
    let fieldValue = []

    if (isProd) {
      const invocation = this.props.sdk.parameters.invocation as Hash
      fieldType = invocation.fieldType
      fieldValue = invocation.fieldValue
    }

    this.setState({ selectedProducts: fieldValue })
    this.allowMultipleSelection = fieldType === 'Array'
    const config = this.props.sdk.parameters.installation as ConfigurationParameters
    ITEMS_PER_PAGE = config.itemsPerPage ? parseInt(config.itemsPerPage) : 24
    this.performSearch()
    this.populateSelects()

    // @ts-ignore
    const moltin = gateway({
      // @ts-ignore
      client_id: this.props.sdk.parameters.installation.clientId,
      // @ts-ignore
      host: this.props.sdk.parameters.installation.host?.replace('https://', ''),
    })

    moltin.Authenticate().then(() => {
      this.setState({
        moltin,
      })
    })
  }

  async populateSelects() {
    const categories = await getCategories(this.props.sdk.parameters.installation)
    const collections = await getCollections(this.props.sdk.parameters.installation)
    this.setState({
      searchCategories: categories,
      searchCollections: collections,
    })
  }

  /*
    Search for products when user stopped typing.
   */
  onSearchByTerm(searchTerm: string) {
    // Debouncing
    if (this.searchTimout) clearTimeout(this.searchTimout)
    this.searchTimout = setTimeout(() => {
      this.setState({ searchTerm: searchTerm }, this.performSearch)
    }, SEARCH_WAIT_TIME)
  }

  async performSearch() {
    const products = await searchProducts(
      this.state.searchTerm,
      this.state.searchCategoryId,
      this.state.searchCollectionId,
      this.props.sdk.parameters.installation,
    )
    if (this.state.currentPage !== 0 && this.state.paginationObject instanceof Pagination) {
      this.state.paginationObject.gotoPage(1)
    }
    this.setState({ productList: products, loading: false })
  }

  onSearchByCategory(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.currentTarget
    this.setState({ searchCategoryId: value }, this.performSearch)
  }

  onSearchByCollection(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.currentTarget
    this.setState({ searchCollectionId: value }, this.performSearch)
  }

  onPageChanged(data: any, paginationObject: any) {
    const offsetPage = ((data.currentPage ?? 0) - 1) * ITEMS_PER_PAGE
    const currentPage = data.currentPage * ITEMS_PER_PAGE
    this.setState({
      offsetItems: offsetPage,
      currentPage: currentPage,
      paginationObject: paginationObject,
    })
  }

  onSelectProduct(connectorValue: string) {
    let selected: string[]

    if (this.allowMultipleSelection) {
      //Selecting List of products
      if (this.state.selectedProducts.includes(connectorValue)) {
        selected = this.state.selectedProducts.filter((productId) => productId !== connectorValue)
      } else {
        selected = [...this.state.selectedProducts, connectorValue]
      }
    } else {
      //Selecting a single product
      selected = [connectorValue]
    }

    this.setState({ selectedProducts: selected })
  }

  saveSelected() {
    this.props.sdk.close(this.state.selectedProducts)
  }

  isLastPageSelected() {
    const total = this.state.productList.length
    const offsetItems = this.state.offsetItems
    const remainingItems = total - offsetItems
    return remainingItems < ITEMS_PER_PAGE && remainingItems === this.state.selectedProducts.length
  }

  selectAll() {
    if (this.allowMultipleSelection && this.state.selectedProducts.length < ITEMS_PER_PAGE) {
      const totalItems = ITEMS_PER_PAGE + this.state.offsetItems

      const productsToSelect = this.state.productList.slice(this.state.offsetItems, totalItems)
      let selected = [] as string[]
      for (const product of productsToSelect) {
        selected.push(product.connectorValue)
      }
      this.setState({ selectedProducts: selected })
    }

    if (this.state.selectedProducts.length === ITEMS_PER_PAGE || this.isLastPageSelected()) {
      this.selectNone()
    }
  }

  selectNone() {
    this.setState({ selectedProducts: [] })
  }

  saveButtonLabel() {
    const totalSelected = this.state.selectedProducts.length
    switch (totalSelected) {
      case 0:
        return 'Save products'
      case 1:
        return 'Save 1 product'
      default:
        return `Save ${totalSelected} products`
    }
  }

  selectAllButtonLabel() {
    if (this.state.selectedProducts.length === ITEMS_PER_PAGE || this.isLastPageSelected()) {
      return 'Select None'
    }
    return 'Select All'
  }

  render() {
    return (
      <>
        <header className="ep-gallery-header">
          {(this.props.sdk.parameters.installation as ConfigurationParameters).productType ===
            'product' && (
            <div className="ep-gallery-controls">
              <TextInput
                placeholder="Search by SKU"
                type="search"
                name="connectorValue-search"
                id="connectorValue-search"
                testId="connectorValue-search"
                value=""
                width="medium"
                className="ep-gallery-search-box"
                onKeyUp={(event) => this.onSearchByTerm((event.target as HTMLInputElement).value)}
              />
              <Icon color="muted" icon="Search" className="ep-gallery-search-icon" />
              <Select
                value={this.state.searchCategoryId}
                onChange={this.onSearchByCategory.bind(this)}
              >
                <Option value="">Select a category</Option>
                {this.state.searchCategories.length > 0 &&
                  this.state.searchCategories.map((category, index) => {
                    return (
                      <Option key={index} value={category.id}>
                        {category.name}
                      </Option>
                    )
                  })}
              </Select>
              <Select
                value={this.state.searchCollectionId}
                onChange={this.onSearchByCollection.bind(this)}
              >
                <Option value="">Select a collection</Option>
                {this.state.searchCollections.length > 0 &&
                  this.state.searchCollections.map((collection, index) => {
                    return (
                      <Option key={index} value={collection.id}>
                        {collection.name}
                      </Option>
                    )
                  })}
              </Select>
            </div>
          )}

          {(this.props.sdk.parameters.installation as ConfigurationParameters).productType ===
            'pcm' && (
            <div className="ep-gallery-controls">
              <TextInput
                placeholder="Enter exact SKU ..."
                type="search"
                name="connectorValue-search"
                id="connectorValue-search"
                testId="connectorValue-search"
                value=""
                width="medium"
                className="ep-gallery-search-box"
                onKeyUp={(event) => this.onSearchByTerm((event.target as HTMLInputElement).value)}
              />
              <Icon color="muted" icon="Search" className="ep-gallery-search-icon" />
            </div>
          )}
          <>
            <div className="ep-gallery-controls-right">
              {this.allowMultipleSelection && (
                <Button buttonType="primary" onClick={this.selectAll.bind(this)}>
                  {this.selectAllButtonLabel()}
                </Button>
              )}
              <span>&nbsp;</span>
              <Button buttonType="primary" onClick={this.saveSelected.bind(this)}>
                {this.allowMultipleSelection ? this.saveButtonLabel() : 'Save'}
              </Button>
            </div>
          </>
        </header>
        <section>
          <div className="ep-gallery-list">
            {this.state.productList.length > 0 &&
              !this.state.loading &&
              this.state.productList
                .slice(this.state.offsetItems, this.state.currentPage)
                .map((product, index) => {
                  return (
                    <ProductGalleryItem
                      product={product}
                      selectedProducts={this.state.selectedProducts}
                      onSelectProduct={(val) => this.onSelectProduct(val)}
                      sdk={this.props.sdk}
                      moltin={this.state.moltin}
                      key={index}
                    />
                  )
                })}
            {this.state.loading && (
              <EmptyState
                headingProps={{ text: 'Loading...' }}
                descriptionProps={{
                  text: 'Please wait while the product list loads.',
                }}
              />
            )}
            {!this.state.loading && this.state.productList.length < 1 && (
              <EmptyState
                headingProps={{ text: 'No product found...' }}
                descriptionProps={{
                  text: 'Please try searching again using different terms.',
                }}
              />
            )}
          </div>
          {this.state.productList.length > 0 && (
            <Pagination
              totalRecords={this.state.productList.length}
              pageLimit={ITEMS_PER_PAGE}
              pageNeighbours={2}
              onPageChanged={this.onPageChanged.bind(this)}
            />
          )}
        </section>
      </>
    )
  }
}

export default ProductGalleryLegacy
