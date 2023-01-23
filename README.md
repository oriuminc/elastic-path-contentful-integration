## Elasticpath product connector for contentful

### Setup and Configs

- Step 1: Make sure you have a developer role for your organization
  ![Make sure you have a developer role for your organization](public/img/contentful-organizations-role-developer.png "dev role")

- Step 2: Create a custom app with the following and get the `APP_DEF_ID`
  ![create a custom app](public/img/ORG_ID_AND_APP_DEF_ID.png "create a custom app")

- Step 3: Install the app to space and save
  ![install to space](public/img/install-to-space.png "install to space")
  ![install to space continue](public/img/install-to-space-continue.png "install to space continue")
  ![auth app](public/img/auth-app.png "auth app")

- Step 4: Complete app configs. Make sure that catalog `tags` and `channel` are exact match of the catalog rules in EP. This will affect the search result, by default it returns the default catalog rules `` (no tags, no channel). (see example below)
  ![update-app-config](public/img/update-app-config.png "update-app-config")

- Step 5: Create and setup `.env` file (or see `.env.example`)
  ```
  CONTENTFUL_ACCESS_TOKEN=
  CONTENTFUL_ORG_ID=
  CONTENTFUL_APP_DEF_ID=

  REACT_APP_EP_HOST=https://...
  REACT_APP_EP_CLIENT_ID=
  ```



### Use localhost (For dev/testing) or upload the app (For prod/stable version)

**Hosted by localhost**: you can host your app from localhost and sync with contentful using the command `npm start`. Make sure `Frontend` is set to your localhost, see example here:
  ![hosted by localhost](public/img/For-dev.png "hosted by localhost")

**Hosted by Contentful**: for production or stable version, push your app to contentful
  - Step 1: build the app with `npm build`
  - Step 2: push to contentful `npm upload` or drag the app folder and upload manually
    (make sure Frontend `Hosted by Contentful` is checked)
    ![hosted by Contentful](public/img/For-prod.png "hosted by Contentful")
  - Step 3: click `Save` to save the app
    ![save the app app](public/img/use-upload-and-host-by-contentful.png "save the app")

### Use EP connector (custom app already uploaded)
  - create a new `content model` for EP connector or add the EP connector as a new `Object` field to another existing content model
    - Step 1: Create `products` field (name/id must be `products`), type is `Object`
    ![new products field](public/img/products-field-types.png "new products field")
    ![products field name and id](public/img/create-content-type-name-and-id.png "products field name and id")
    - Step 2: Select appearance and save
    ![products field appearance](public/img/create-content-type-appearance.png "products field appearance")
    - Step 3: Add content (entry)
    ![add entry](public/img/add-entry.png "add entry")
    - Step 4: Pick products and save
    ![pick products and save](public/img/pick-products-and-save.png "pick products and save") 

### Notes: make sure to update the `catalog` list in the app config, this will directly affect the search result.