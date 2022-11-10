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

// @ts-ignore
const Dialog = () => {
  const [value, setValue] = useState<string>('');
  const [dataPagination, setDataPagination] = useState({
    links: {
      next: '',
      last: '',
      first: '',
      prev: ''
    },
    meta: {
      results: {
        total: 0
      },
      page: {
        current: 1,
        limit: 25,
        total: 0
      },
    },
  });
  const debouncedValue = useDebounce<string>(value, 500);
  const [selectValue, setSelectValue] = useState('');
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any>({});
  const [products, setProducts] = useState<any>([]);

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

  const searchProductsByNameInCatalog = async (name: string) => {
    const data = await getProducts({
      filterAttribute: EpFilterAttribute.NAME,
      value: name,
    });

    if (!data.length) return { products: [] };

    const { data: products, included, links, meta } = await getCatalogProducts({
      filterAttribute: EpFilterAttribute.SKU,
      filterOperator: EpFilterOperator.IN,
      values: data.map((product: any) => product.attributes.sku), // [data[51].attributes.sku, data[50].attributes.sku]
      catalogTag: selectValue
    });

    return {
      products: mapCatalogProductWithMainImages(products, included) ?? [],
      links,
      meta: {
        ...meta,
        page: {
          ...meta.page,
          // current: 0
        }
      }
    };
  }
  const getPageToCall = (currentPage: number, nextPage: number) => {
    console.log(nextPage, currentPage);
    if (nextPage === currentPage + 1) {
      return dataPagination.links.next;
    } else if (nextPage === currentPage - 1) {
      return dataPagination.links.prev;
    } else {
      return dataPagination.links.first;
    }

  }

  const handleChangePage = async (nextPage: number) => {
    window.scrollTo({top: 0, left: 0, behavior: 'smooth'});

    const pageToCall = getPageToCall(dataPagination.meta.page.current, nextPage + 1);
    console.log(pageToCall);
    if (pageToCall) {
      const { data: products, links, meta, included }= await getNextProductPage(pageToCall);
      console.log(links, meta);
      setProducts(mapCatalogProductWithMainImages(products, included));
      setDataPagination({
        links,
        meta
      });
    }
  }

  useEffect(() => {
    if (debouncedValue) {
      searchProductsByNameInCatalog(debouncedValue)
        .then(({ products, links, meta }: any) => {
          if (products.length) {
            setDataPagination({links, meta})
            setProducts([...products]);
          }
        });
    }
  }, [debouncedValue]);

  useEffect(() => {
    initAxiosInterceptors({ host: 'https://useast.api.elasticpath.com' })
    const catalogs = sdk.parameters.installation.catalogs;
    setCatalogs(catalogs);
    if (catalogs && catalogs[0]) {
      setSelectValue(catalogs[0].headerTag);
    }
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
              isLastPage={((dataPagination.meta.page.current * dataPagination.meta.page.limit) + dataPagination.meta.page.total) === dataPagination.meta.results.total}
              activePage={dataPagination.meta.page.current - 1}
              onPageChange={handleChangePage}
              itemsPerPage={dataPagination.meta.page.limit}
              totalItems={dataPagination.meta.results.total}
            />: null
        }
      </Flex>
      </Workbench.Content>
    </Workbench>;
};


export default Dialog;
