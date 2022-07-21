import React, {ChangeEvent, useEffect, useState} from 'react';
import { Workbench } from '@contentful/f36-workbench';

import {
  Box,
  Button,
  Card,
  EntryCard,
  Flex,
  Paragraph,
  TextInput,
  Text,
  ButtonGroup,
  IconButton,
  Menu,
  Select,
  DisplayText, Asset, Pagination
} from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import {getCatalogProducts, getFile, getProducts, mapCatalogProductWithMainImages} from "../api/pxm";
import {EpFilterAttribute, EpFilterOperator} from "../types";
import entryEditor from "./EntryEditor";
import { ChevronDownIcon, PlusIcon, MenuIcon } from '@contentful/f36-icons';
import { useDebounce } from 'usehooks-ts';

import ProductImage from '../components/ProductImage';
import page from "./Page";

// @ts-ignore
const Dialog = () => {
  const [value, setValue] = useState<string>('');
  const [page, setPage] = useState(0);
  const debouncedValue = useDebounce<string>(value, 500);
  const [selectValue, setSelectValue] = useState('');
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
          main_image: product.main_image
        }
      });
    }
  };

  const searchProductsByNameInCatalog = async (name: string) => {
    const data = await getProducts({
      filterAttribute: EpFilterAttribute.NAME,
      value: name,
    });

    if (!data.length) return [];

    const { data: products, included } = await getCatalogProducts({
      filterAttribute: EpFilterAttribute.SKU,
      filterOperator: EpFilterOperator.IN,
      values: data.map((product: any) => product.attributes.sku), // [data[51].attributes.sku, data[50].attributes.sku]
      catalog: selectValue
    });

    return mapCatalogProductWithMainImages(products, included);
  }

  useEffect(() => {
    if (debouncedValue) {
      searchProductsByNameInCatalog(debouncedValue)
        .then((products) => {
          setProducts([...products]);
        });
    }
  }, [debouncedValue]);

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
                // background: 'rgb(3, 111, 227)',
                // color: 'white',
              }}
              value={selectValue}

              onChange={(e) => setSelectValue(e.target.value)}
            >
              <Select.Option value="wine">wine</Select.Option>
              <Select.Option value="accessories">accessories</Select.Option>
            </Select>
            {/*<IconButton*/}
            {/*  variant="primary"*/}
            {/*  aria-label="Open dropdown"*/}
            {/*  icon={<ChevronDownIcon />}*/}
            {/*/>*/}

          </ButtonGroup>
          <TextInput
            style={{ width: '50%' }}
            // value={sdk.field.getValue()}
            onChange={handleChange}
          />
        </Flex>
        <Box>
          <Button
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
          products.length ? <Pagination
            activePage={page}
            onPageChange={setPage}
            itemsPerPage={25}
            totalItems={5}
          />: null
        }
      </Flex>
      </Workbench.Content>
    </Workbench>;
};


export default Dialog;
