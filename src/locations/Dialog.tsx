import React, {ChangeEvent, useEffect, useState} from 'react';
import { Workbench } from '@contentful/f36-workbench';

import {
  Box,
  Button,
  Card,
  Flex,
  TextInput,
  Text,
  ButtonGroup,
  Select,
  Asset,
  Pagination
} from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {getCatalogProducts, getNextProductPage, getProducts, mapCatalogProductWithMainImages} from "../api/pxm";
import {EpFilterAttribute, EpFilterOperator} from "../types";
import { useDebounce } from 'usehooks-ts';
import {initAxiosInterceptors} from "../helpers/authHelpers";

const PAGE_SIZE = 10

// @ts-ignore
const Dialog = () => {
  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce<string>(value, 500);
  const [selectValue, setSelectValue] = useState('');
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any>({});
  const [products, setProducts] = useState<any>([]);
  const [paging, setPaging] = useState({
    offset: 0,
    total: undefined
  })
  // searchIsReady is a flag to indicate that the axios req interceptor is set
  const [searchIsReady, setSearchIsReady] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }
  const sdk = useSDK<DialogExtensionSDK>();

  const selectProduct = (product: any) => {
    if (selectedProducts[product.id]) {
      const { [product.id]: _, ...rest } = selectedProducts;
      setSelectedProducts(rest);
    } else {
      setSelectedProducts({
        ...selectedProducts,
        [product.id]: {
          name: product.name,
          sku: product.sku,
          id: product.id,
          main_image: product.main_image,
          catalogTag: selectValue
        }
      });
    }
  };

  const searchProductsByNameInCatalog = async ({name, limit, offset}:{name: string, limit?: number, offset?: number
  }) => {
    const data = await getProducts({
      filterAttribute: EpFilterAttribute.NAME,
      value: name,
      limit,
      offset
    });

    if (!data.total) return { products: [] };

    const { data: products, included } = await getCatalogProducts({
      filterAttribute: EpFilterAttribute.SKU,
      filterOperator: EpFilterOperator.IN,
      values: data.products.map((product: any) => product.attributes.sku), // [data[51].attributes.sku, data[50].attributes.sku]
      catalogTag: selectValue
    });

    return {
      products: mapCatalogProductWithMainImages(products, included) ?? [],
      total: data.total
    };
  }

  const getProductResultsPage = (name: string, offset: number) => {
    searchProductsByNameInCatalog({
      name,
      offset,
      limit: PAGE_SIZE,
    }).then(({ products, total }) => {
      setProducts(products);
      setPaging({
        ...paging,
        offset,
        total
      })
    });
  }

  const handleChangePage = async (nextPage: number) => {
    const newPageOffset = nextPage * PAGE_SIZE
    getProductResultsPage(debouncedValue, newPageOffset)
  }

  useEffect(() => {
    if (searchIsReady) {
      getProductResultsPage(debouncedValue, 0)
    }
  }, [debouncedValue, searchIsReady]);

  useEffect(() => {
    initAxiosInterceptors({ host: 'https://useast.api.elasticpath.com' })
    const catalogs = sdk.parameters.installation.catalogs;
    setCatalogs(catalogs);
    if (catalogs && catalogs[0]) {
      setSelectValue(catalogs[0].headerTag);
    }
    setSearchIsReady(true)
  }, []);

  return <Workbench>
    <Workbench.Header
        title={'Add products'}
        actions={<>
          <Flex
              className={'awesome-search'}
              style={{ width: '50%' }}
              gap={'spacingXs'}
          >
            <ButtonGroup >
              <Button variant="primary">Catalog</Button>
              <Select
                  id="optionSelect-controlled"
                  name="optionSelect-controlled"
                  style={{
                    borderRadius: '0px 6px 6px 0px',
                  }}
                  value={selectValue}

                  onChange={(e) => setSelectValue(e.target.value)}
              >
                {
                  catalogs.map((catalog: any) =>
                      <Select.Option key={catalog.name} value={catalog.headerTag}>{catalog.name}</Select.Option>
                  )
                }
              </Select>
            </ButtonGroup>
            <TextInput
                style={{ width: '50%' }}
                placeholder="Product (case-sensitive)"
                onChange={handleChange}
            />
          </Flex>
          <Box>
            <Button
                variant="positive"
                onClick={async () => {
                  // @ts-ignore
                  sdk.close(Object.values(selectedProducts));
                }}
            >
              Save products
            </Button>
          </Box>
        </>}
    />

    <Workbench.Content style={{ height: '100%' }} type={'full'}>
      <Flex
          fullHeight={true}
          marginTop={"spacingM"}
          marginBottom={"spacingM"}
          gap="spacingS"
          flexWrap="wrap"
          alignItems={"center"}
          justifyContent={'center'}
      >
        {
          products.length ?
              <Pagination
                  isLastPage={paging.total && (paging.total < (paging.offset + PAGE_SIZE) || paging.total < PAGE_SIZE)}
                  activePage={paging.offset / PAGE_SIZE}
                  onPageChange={handleChangePage}
                  itemsPerPage={PAGE_SIZE}
                  totalItems={paging.total}
              />: null
        }
        {
          products.length ?
              (products.map((product: any) =>
                      <Box key={product.id}
                           style={{maxWidth: '200px'}}
                      >
                        <Card style={{ minHeight: 150 }}
                              isSelected={!!selectedProducts[product.id]}
                              onClick={() => selectProduct(product)}>
                          <Flex flexDirection={"column"}>
                            <Asset src={product.main_image.link.href} style={{height: '12em'}}/>
                            <Text isTruncated={true} as={'span'} style={{width: '100%'}}>
                              {product.name}
                            </Text>
                            <Text fontWeight={"fontWeightDemiBold"}>
                              {product.sku}
                            </Text>
                          </Flex>
                        </Card>
                      </Box>)
              ) : <Text fontSize={'fontSize2Xl'} fontColor={'gray400'}> No products found </Text>
        }
        {
          products.length ?
              <Pagination
                  isLastPage={paging.total && (paging.total < (paging.offset + PAGE_SIZE) || paging.total < PAGE_SIZE)}
                  activePage={paging.offset / PAGE_SIZE}
                  onPageChange={handleChangePage}
                  itemsPerPage={PAGE_SIZE}
                  totalItems={paging.total}
              />: null
        }
      </Flex>
    </Workbench.Content>
  </Workbench>;
};


export default Dialog;
