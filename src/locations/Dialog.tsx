import React, {ChangeEvent, useEffect, useState} from 'react';
import { Workbench } from '@contentful/f36-workbench';

import {Box, Button, Card, EntryCard, Flex, Paragraph, TextInput, Text, ButtonGroup, IconButton, Menu, Select } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import {getCatalogProducts, getFile, getProducts} from "../api/pxm";
import {EpFilterAttribute, EpFilterOperator} from "../types";
import entryEditor from "./EntryEditor";
import { ChevronDownIcon, PlusIcon, MenuIcon } from '@contentful/f36-icons';
import { useDebounce } from 'usehooks-ts';

import ProductImage from '../components/ProductImage';

// @ts-ignore
const Dialog = () => {
  const [value, setValue] = useState<string>('');
  const debouncedValue = useDebounce<string>(value, 500);
  const [selectValue, setSelectValue] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any>({});
  const [products, setProducts] = useState<any>([]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }
  const sdk = useSDK<DialogExtensionSDK>();

  const selectProduct = (product: any, mainImage: any) => {
    if (selectedProducts[product.id]) {
      const { [product.id]: _, ...rest } = selectedProducts;
      setSelectedProducts(rest);
    } else {
      setSelectedProducts({
        ...selectedProducts,
        [product.id]: {
          name: product.attributes.name,
          sku: product.attributes.sku,
          id: product.id,
          image: mainImage.link.href
        }
      });
    }
  };

  const searchProductsByNameInCatalog = async (name: string) => {
    const data = await getProducts({
      filterAttribute: EpFilterAttribute.NAME,
      value: name,
    });

    if (!data.length) return;

    const { data: products, included } = await getCatalogProducts({
      filterAttribute: EpFilterAttribute.SKU,
      filterOperator: EpFilterOperator.IN,
      values: data.map((product: any) => product.attributes.sku), // [data[51].attributes.sku, data[50].attributes.sku]
    });

    const mainImagesById = included.main_images.reduce(
      (obj: any, item: any) => Object.assign(obj, { [item.id]: {...item} }), {}
    );

    return products ? products.map(
      (product: any) => ({ ...product, main_image: mainImagesById[product.relationships.main_image.data.id]})
    ) : [];
  }

  useEffect(() => {
    if (debouncedValue) {
      console.log('text: ->', debouncedValue);
      searchProductsByNameInCatalog(debouncedValue)
        .then((products) => {
          if (products) setProducts([...products]);
        });
    }
  }, [debouncedValue]);

  return <Workbench>
    <Workbench.Header title={'Add products'} actions={      <>
      <Flex className={'awesome-search'}>
        <ButtonGroup>
          <Button variant="secondary" >Catalog</Button>

          <Select
            id="optionSelect-controlled"
            name="optionSelect-controlled"
            style={{
              borderRadius: '0px 6px 6px 0px',
              background: 'rgb(3, 111, 227)',
              color: 'white',
            }}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          >
            <Select.Option value="optionOne">Option 1</Select.Option>
            <Select.Option value="optionTwo">Long Option 2</Select.Option>
          </Select>
          {/*<IconButton*/}
          {/*  variant="primary"*/}
          {/*  aria-label="Open dropdown"*/}
          {/*  icon={<ChevronDownIcon />}*/}
          {/*/>*/}

        </ButtonGroup>
        <TextInput
          // value={sdk.field.getValue()}
          onChange={handleChange}
        />


      </Flex>
      <Box>
        <Button
          onClick={async () => {
            // @ts-ignore
            sdk.close(selectedProducts);
          }}
        >
          Save products
        </Button>
      </Box>
    </>}></Workbench.Header>

    <Workbench.Content>
      <Flex
        marginTop={"spacingM"}
        marginBottom={"spacingM"}
        gap="spacingS"
        flexWrap="wrap"
        justifyContent={'center'}
      >
        {
          products.map((product: any) =>
            <Box key={product.id}
                 style={{maxWidth: '200px' }}
            >
              <Card style={{ minHeight: 150 }}
                    isSelected={!!selectedProducts[product.id]}
                    onClick={() => selectProduct(product, product.main_image)}>
                <Flex flexDirection={"column"}>
                  <ProductImage imageSrc={product.main_image}/>
                  <Text isTruncated={true} as={'span'} style={{ width: '100%' }}>
                    {product.attributes.name}
                  </Text>
                  <Text fontWeight={"fontWeightDemiBold"}>
                    {product.attributes.sku}
                  </Text>
                </Flex>
              </Card>
            </Box>
          )
        }
      </Flex>
      </Workbench.Content>
    </Workbench>;
};

export default Dialog;
