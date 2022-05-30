import { useEffect, useState } from 'react'
import { Moltin } from '@moltin/sdk'
import { FlatProduct } from '../interfaces'

export const useProductImageUrl = (moltin: Moltin | null, product: FlatProduct) => {
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (!moltin || product.image || !product.imageFileId) {
      return
    }

    const fetchImageUrl = async () => {
      moltin.Files.Get(product.imageFileId!).then((file) => {
        setImageUrl(file.data.link.href)
      })
    }

    fetchImageUrl()
  }, [moltin, product])

  return {
    imageUrl: product.image || imageUrl,
  }
}
