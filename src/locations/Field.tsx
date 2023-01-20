import React, { useEffect, useState } from "react";

import {
  Box,
  Stack,
  DragHandle,
  IconButton,
  Card,
  Subheading,
  Text,
  Flex,
  Asset,
} from "@contentful/f36-components";

import { PlusCircleIcon, DeleteIcon, CloseIcon } from "@contentful/f36-icons";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Draggable from "../components/Draggable";
import {
  getAccessToken,
  getCatalogProducts,
  mapCatalogProductWithMainImages,
} from "../api/pxm";
import { EpFilterAttribute, EpFilterOperator } from "../types";
import { initAxiosInterceptors, setToken } from "../helpers/authHelpers";
import { EP_HOST } from "../constants";

const Field = () => {
  const [currentProducts, setCurrentProducts] = useState<any[]>([]);
  const sensors = [useSensor(PointerSensor)];

  const sdk = useSDK<FieldExtensionSDK>();

  useEffect(() => {
    // adjust the contentful field to the pxm field
    sdk.window.startAutoResizer();

    getAccessToken({
      clientId: sdk.parameters.installation.clientId,
      clientSecret: sdk.parameters.installation.clientSecret,
    })
      .then((response) => {
        setToken(response.access_token);
        initAxiosInterceptors({
          host: EP_HOST,
        });
      })
      .then(async () => {
        await syncDataProducts();
      });
  }, []);

  const syncDataProducts = async () => {
    const currentProducts = sdk.entry.fields.products.getValue();

    if (currentProducts && currentProducts.length) {
      // Getting the product details from EP in case some was updated
      const { data: products, included } = await getCatalogProducts({
        filterAttribute: EpFilterAttribute.SKU,
        filterOperator: EpFilterOperator.IN,
        values: currentProducts.map((product: any) => product.sku),
      });

      // EP is not returning the products in the order we have specified in the in filter
      const productsWithImage = mapCatalogProductWithMainImages(
        products,
        included
      );
      const updatedProducts = currentProducts.map((product: any) => {
        const newData = productsWithImage.find((p: any) => p.id === product.id);
        return {
          ...newData,
        };
      });

      // @ts-ignore
      setCurrentProducts(updatedProducts);
    }
  };

  const removeAllProducts = async () => {
    sdk.entry.fields.products.setValue([]);
    setCurrentProducts([]);
  };

  const removeProduct = async (productId: any) => {
    const currentProducts = sdk.entry.fields.products.getValue();

    const newProducts = currentProducts.filter(
      (product: any) => product.id !== productId
    );

    const products = (await sdk.entry.fields.products.setValue([
      ...newProducts,
    ])) as any;

    setCurrentProducts([...products]);
  };

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (over) {
      if (active.id !== over.id) {
        const oldIndex = currentProducts.findIndex(
          (product) => product.id === active.id
        );
        const newIndex = currentProducts.findIndex(
          (product) => product.id === over.id
        );

        const newOrder = arrayMove(currentProducts, oldIndex, newIndex);

        setCurrentProducts(newOrder);
        sdk.entry.fields.products.setValue(newOrder);
      }
    }
  }

  async function addProducts() {
    const selectedProducts = await sdk.dialogs.openCurrentApp({
      width: "fullWidth",
      minHeight: "70vh",
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
    });

    const currentProducts = sdk.entry.fields.products.getValue();

    // @ts-ignore
    const allProducts = await sdk.entry.fields.products.setValue([
      ...(currentProducts ?? []),
      ...(selectedProducts ?? []),
    ]);

    // @ts-ignore
    setCurrentProducts([...allProducts]);
  }

  return (
    <Box>
      <Stack>
        <Flex
          fullWidth={true}
          justifyContent={"space-between"}
          gap={"spacingS"}
        >
          <IconButton
            onClick={addProducts}
            variant="positive"
            title="Add products"
            aria-label="Select the date"
            icon={<PlusCircleIcon />}
          >
            Add Product
          </IconButton>

          <IconButton
            onClick={removeAllProducts}
            variant="negative"
            title="Clean products"
            aria-label="Select the date"
            icon={<DeleteIcon />}
          >
            Clean
          </IconButton>
        </Flex>
      </Stack>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
        autoScroll={true}
      >
        <SortableContext
          items={currentProducts.map((product) => product.id)}
          strategy={verticalListSortingStrategy}
        >
          {currentProducts.map((product: any) => (
            <Draggable key={product.id} id={product.id}>
              {
                // @ts-ignore
                ({ listeners, attributes, isDragging }) => (
                  <Card
                    padding={"none"}
                    withDragHandle
                    dragHandleRender={() => (
                      <DragHandle {...listeners} {...attributes} />
                    )}
                    isDragging={isDragging}
                  >
                    <Flex flexDirection={"row"}>
                      <Flex style={{ width: "80%" }} alignItems={"center"}>
                        <Box style={{ width: "20%" }}>
                          <Asset
                            src={product?.main_image?.link.href}
                            style={{ height: "8em", width: "100%" }}
                          />
                        </Box>
                        <Flex
                          flexDirection={"column"}
                          padding={"spacingS"}
                          style={{ width: "80%" }}
                        >
                          <Subheading>{product.name}</Subheading>
                          <Text
                            fontColor={"gray600"}
                            fontWeight={"fontWeightMedium"}
                          >
                            {product.sku}
                          </Text>
                        </Flex>
                      </Flex>
                      <Box
                        style={{
                          textAlign: "right",
                          width: "20%",
                          paddingTop: "0.5em",
                          paddingRight: "0.5em",
                        }}
                      >
                        <CloseIcon
                          variant={"muted"}
                          onClick={() => removeProduct(product.id)}
                        />
                      </Box>
                    </Flex>
                  </Card>
                )
              }
            </Draggable>
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
};

export default Field;
