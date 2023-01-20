import React, { useCallback, useState, useEffect } from "react";
import { AppExtensionSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Paragraph,
  TextInput,
  FormControl,
  HelpText,
  FormLabel,
  Button,
  IconButton,
  Box,
  Modal,
  EntityListItem,
  MenuItem,
} from "@contentful/f36-components";
import { css } from "emotion";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";
import { PlusCircleIcon } from "@contentful/f36-icons";
import { EP_HOST } from "../constants";

export interface AppInstallationParameters {
  clientId?: string;
  clientSecret?: string;
  elasticPathHost?: string;
  catalogs?: any[];
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [isShown, setShown] = useState(false);

  const sdk = useSDK<AppExtensionSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const submitForm = async (e: any) => {
    const { catalogName, headerTag, headerChannel } = e.target.elements;

    setParameters({
      ...parameters,
      catalogs: [
        ...(parameters.catalogs || []),
        {
          name: catalogName.value,
          headerTag: headerTag.value,
          headerChannel: headerChannel.value,
        },
      ],
    });

    setShown(false);
  };

  const removeCatalog = (index: number) => {
    const newCatalogs = [...(parameters.catalogs || [])];
    newCatalogs.splice(index, 1);
    setParameters({
      ...parameters,
      catalogs: newCatalogs,
    });
  };

  return (
    <Box className={css({ margin: "80px" })} style={{ width: "60%" }}>
      <Form>
        <Heading>App Config</Heading>
        <Paragraph>
          Enter your Elastic Path configuration in order to fetch products to be
          linked on your content.
        </Paragraph>

        <FormControl>
          <FormLabel isRequired>ElasticPath Client ID</FormLabel>
          <TextInput
            name="clientId"
            id="clientId"
            value={parameters.clientId || ""}
            onChange={(e) => {
              setParameters({
                ...parameters,
                clientId: e.target.value,
              });
            }}
          />
          <HelpText>
            Copy your ElasticPath Client ID and enter it here.
          </HelpText>
        </FormControl>

        <FormControl>
          <FormLabel isRequired>ElasticPath Client Secret</FormLabel>
          <TextInput
            value={parameters.clientSecret || ""}
            name="clientSecret"
            id="clientSecret"
            onChange={(e) => {
              setParameters({
                ...parameters,
                clientSecret: e.target.value,
              });
            }}
          />
          <HelpText>
            Copy your ElasticPath Client Secret and enter it here.
          </HelpText>
        </FormControl>

        <FormControl>
          <FormLabel isRequired>ElasticPath host url</FormLabel>
          <TextInput name="host" id="host" defaultValue={EP_HOST} />
          <HelpText>Copy your ElasticPath host url and enter it here.</HelpText>
        </FormControl>

        <FormControl>
          <FormLabel>Catalogs</FormLabel>

          {parameters.catalogs?.map((catalog: any, index: number) => (
            <Box key={index} marginTop={"spacingXs"} marginBottom={"spacingXs"}>
              <EntityListItem
                actions={[
                  <MenuItem onClick={() => removeCatalog(index)}>
                    Remove
                  </MenuItem>,
                ]}
                withThumbnail={false}
                title={catalog.name}
                description={`
                    ${
                      catalog.headerTag
                        ? `Header Tag: ${catalog.headerTag}`
                        : ""
                    }  
                    ${
                      catalog.headerChannel
                        ? `, Header Channel: ${catalog.headerChannel}`
                        : ""
                    }
                  `}
              />
            </Box>
          ))}

          <Box marginTop={"spacingM"}>
            <IconButton
              onClick={() => setShown(true)}
              variant="positive"
              title="Add products"
              aria-label="Select the date"
              icon={<PlusCircleIcon />}
            >
              Add Catalog
            </IconButton>
          </Box>
          <HelpText>
            Insert the catalogs you want to link to your content.
          </HelpText>
        </FormControl>

        <Modal onClose={() => setShown(false)} isShown={isShown}>
          {() => (
            <>
              <Modal.Header
                title="A modal with a specific size"
                onClose={() => setShown(false)}
              />
              <Modal.Content>
                <Form onSubmit={submitForm}>
                  <FormControl>
                    <FormControl.Label isRequired>
                      Catalog Name
                    </FormControl.Label>
                    <TextInput maxLength={20} name="catalogName" />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Header Tag</FormControl.Label>
                    <TextInput maxLength={20} name="headerTag" />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>Header Channel</FormControl.Label>
                    <TextInput maxLength={20} name="headerChannel" />
                  </FormControl>
                  <Button
                    variant="positive"
                    type="submit"
                    style={{ float: "right" }}
                  >
                    Add Catalog
                  </Button>
                </Form>
              </Modal.Content>
            </>
          )}
        </Modal>
      </Form>
    </Box>
  );
};

export default ConfigScreen;
