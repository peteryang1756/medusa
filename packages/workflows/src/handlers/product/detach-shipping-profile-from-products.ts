import { ProductTypes } from "@medusajs/types"
import { WorkflowArguments } from "../../helper"

type ProductHandle = string
type ShippingProfileId = string

export async function detachShippingProfileFromProducts({
  container,
  context,
  data,
}: WorkflowArguments<{
  productsHandleShippingProfileIdMap: Map<ProductHandle, ShippingProfileId>
  products: ProductTypes.ProductDTO[]
}>): Promise<void> {
  const { manager } = context
  const productsHandleShippingProfileIdMap =
    data.productsHandleShippingProfileIdMap
  const products = data.products

  const shippingProfileService = container.resolve("shippingProfileService")
  const shippingProfileServiceTx =
    shippingProfileService.withTransaction(manager)

  const profileIdProductIdsMap = new Map<ShippingProfileId, ProductHandle[]>()
  products.forEach((product) => {
    const profileId = productsHandleShippingProfileIdMap.get(product.handle!)
    if (profileId) {
      const productIds = profileIdProductIdsMap.get(profileId) || []
      productIds.push(product.id)
      profileIdProductIdsMap.set(profileId, productIds)
    }
  })

  await Promise.all(
    Array.from(profileIdProductIdsMap.entries()).map(
      async ([profileId, productIds]) => {
        return await shippingProfileServiceTx.removeProducts(
          profileId,
          productIds
        )
      }
    )
  )
}

detachShippingProfileFromProducts.aliases = {
  products: "products",
}