import React, { useState } from "react";
import { TextInput, Box, Stack, Button } from "@contentful/f36-components";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";
import { getProducts } from "../api/pxm";
import { EpFilterAttribute, EpFilterOperator } from "../types";

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  const [products, setProducts] = useState({});

  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return (
    <Box>
      <Stack>
        <Box>
          <TextInput
            // value={sdk.field.getValue()}
            onChange={(e) => {
              sdk.field.setValue(e.target.value);
            }}
          />
        </Box>
        <Box>
          <Button
            onClick={async () => {
              const data = await getProducts({
                filterAttribute: EpFilterAttribute.SKU,
                filterOperator: EpFilterOperator.IN,
                values: [sdk.field.getValue()],
              });
              console.log("search response = ", data);

              if (data) setProducts(data?.data?.[0].id ?? {});
            }}
          >
            Search
          </Button>
        </Box>
        <Box>
          <Button
            onClick={() => {
              const title = sdk.field.getValue();
              sdk.entry.fields.products.setValue([
                ...sdk.entry.fields.products.getValue(),
                title,
              ]);
            }}
          >
            Add to Products
          </Button>
        </Box>
      </Stack>
      <Stack>
        <Box>Response: {JSON.stringify(products)}</Box>
      </Stack>
    </Box>
  );
};

export default Field;
