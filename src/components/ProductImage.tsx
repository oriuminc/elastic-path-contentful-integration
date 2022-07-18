import { Asset } from '@contentful/f36-components';
import React, {useState, useEffect} from 'react';
import {getFile} from "../api/pxm";

const ProductImage = ({ imageSrc }: any) => {
  console.log('<><><>', imageSrc);
  return (
    <>
      <Asset src={imageSrc.link.href} style={{ height: '12em'}}/>
    </>
  );
};

export default ProductImage;
