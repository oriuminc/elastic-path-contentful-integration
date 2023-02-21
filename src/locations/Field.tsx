import { useEffect, useState } from "react";
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
  const sdk = useSDK<FieldExtensionSDK>();
  // if its Symbol means only one value, if JSON takes multiple values
  const singleSelect = sdk.field.type === 'Symbol';
  const [currentProducts, setCurrentProducts] = useState<any[]>([]);
  const sensors = [useSensor(PointerSensor)];

  const setFieldValue = (products: any[]) => {
    try {
      sdk.entry.fields.slug.setValue(`product/${products[0].sku}`)
    } catch (e) { console.error('no slug field') }
    try {
      sdk.entry.fields.epUUID.setValue(`${products[0].id}`)
    } catch (e) { console.error('no epUUID field') }
    if (singleSelect) {
      const saveObject = products.map((p) => {
        return {
          catalogChannel: p.catalogChannel || '',
          catalogTag: p.catalogTag || '',
          id: p.id,
          sku: p.sku,
        }
      })
      return sdk.field.setValue(JSON.stringify(saveObject))

    } else {
      return sdk.field.setValue(products)
    }
  }

  const getFieldValue = () => {
    const data = sdk.field.getValue();
    return singleSelect ? JSON.parse(data) : data
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncDataProducts = async () => {
    const currentProducts = getFieldValue();
    const { catalogChannel, catalogTag } = currentProducts[0] || { catalogChannel: '', catalogTag: '' }
    if (currentProducts && currentProducts.length) {
      // Getting the product details from EP in case some was updated
      const { data: products, included } = await getCatalogProducts({
        filterAttribute: EpFilterAttribute.SKU,
        filterOperator: EpFilterOperator.IN,
        values: currentProducts.map((product: any) => product.sku),
        catalogTag,
        catalogChannel,
      });

      // EP is not returning the products in the order we have specified in the in filter
      const productsWithImage = mapCatalogProductWithMainImages(
        products,
        included
      );
      if (singleSelect) {
        setCurrentProducts(productsWithImage);
      } else {
        const updatedProducts = currentProducts.map((product: any) => {
          const newData = productsWithImage.find((p: any) => p.id === product.id);
          return {
            ...newData,
          };
        });
        // @ts-ignore
        setCurrentProducts(updatedProducts);
      }
    }
  };

  const removeAllProducts = async () => {
    singleSelect ? sdk.field.setValue('') : sdk.field.setValue([])
    setCurrentProducts([]);
  };

  const removeProduct = async (productId: any) => {
    const currentProducts = getFieldValue();
    const newProducts = currentProducts.filter((product: any) => product.id !== productId)
    const products = await setFieldValue([...newProducts]) as any;
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
        setFieldValue(newOrder);
      }
    }
  }

  async function addProducts() {
    const selectedProducts = await sdk.dialogs.openCurrentApp({
      width: "fullWidth",
      minHeight: "70vh",
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        singleSelect
      }
    });

    if (singleSelect) {
      await setFieldValue(selectedProducts);
      setCurrentProducts(selectedProducts);
    } else {
      const currentProducts = getFieldValue();
      // @ts-ignore
      const allProducts = await setFieldValue([
        ...(currentProducts ?? []),
        ...(selectedProducts ?? []),
      ]);
      // @ts-ignore
      setCurrentProducts([...allProducts]);
    }
  }

  const actionButtons =
    singleSelect ?
      currentProducts.length > 0 ?
        <IconButton
          onClick={removeAllProducts}
          variant="negative"
          title="Clean"
          aria-label="Select the date"
          icon={<DeleteIcon />}>
          Clean
        </IconButton>
        :

        <IconButton
          onClick={addProducts}
          variant="positive"
          title="Pick a Product"
          aria-label="Select the date"
          icon={<PlusCircleIcon />}>
          Add Product
        </IconButton>
      :
      <>
        <IconButton
          onClick={addProducts}
          variant="positive"
          title="Add products"
          aria-label="Select the date"
          icon={<PlusCircleIcon />}>
          Add Product
        </IconButton><IconButton
          onClick={removeAllProducts}
          variant="negative"
          title="Clean products"
          aria-label="Select the date"
          icon={<DeleteIcon />}>
          Clean
        </IconButton>
      </>

  return (
    <Box>
      <Stack>
        <Flex
          fullWidth={true}
          justifyContent={"space-between"}
          gap={"spacingS"} >
          {actionButtons}
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
                    withDragHandle={!singleSelect}
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
                      {!singleSelect && <Box
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
                      </Box>}
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
