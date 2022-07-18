import React, {useEffect, useState} from "react";
import {TextInput, Box, Stack, Button, List, EntryCard} from "@contentful/f36-components";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";


const Field = () => {
  const [ currentProducts, setCurrentProducts ] = useState<{ [key: string]: any}>([]);
  const sdk = useSDK<FieldExtensionSDK>();


  useEffect(() => {
    // adjust the contentful field to the pxm field
    sdk.window.startAutoResizer();
    const currentProducts = sdk.entry.fields.products.getValue();
    console.log(currentProducts)
    setCurrentProducts(currentProducts);
  }, []);

  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return (
    <Box>
      <Stack>
        <Box>
          <Button
            onClick={async () => {
              const selectedProducts = await sdk.dialogs.openCurrentApp({
                width: "fullWidth",
                minHeight: "70vh",
                parameters: {
                  products: [],
                },
                shouldCloseOnOverlayClick: true,
                shouldCloseOnEscapePress: true,
              });

              console.log('<><>',selectedProducts);
              console.log(sdk.entry.fields.products.getValue());

              const currentProducts = sdk.entry.fields.products.getValue();

              console.log(currentProducts);
                // @ts-ignore
              const allProducts = await sdk.entry.fields.products.setValue({
                ...currentProducts,
                ...selectedProducts,
              });

              // @ts-ignore
              setCurrentProducts({ ...allProducts });
            }}
          >
            Add Products
          </Button>

          {/*{ JSON.stringify(currentProducts) }*/}
          <Box>
            {
              Object.keys(currentProducts)
                .map((productId: string) =>
                  <EntryCard
                    marginTop={"spacingM"}
                    marginBottom={"spacingM"}
                    size="default"
                    title={currentProducts[productId].name}
                    description={currentProducts[productId].sku}
                  />)
            }
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default Field;
