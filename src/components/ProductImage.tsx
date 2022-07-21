import { Asset } from '@contentful/f36-components';

const ProductImage = ({ imageSrc }: any) =>
  (
    <>
      <Asset src={imageSrc.link.href} style={{height: '12em'}}/>
    </>
  );

export default ProductImage;
