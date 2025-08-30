import { OrderDetailPage } from "../../../components/order-detail-page"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailPageRoute({ params }: PageProps) {
  const { id } = await params
  return <OrderDetailPage orderId={id} />
}