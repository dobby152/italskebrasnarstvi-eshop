import { OrderDetailPage } from "../../../components/order-detail-page"

interface PageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPageRoute({ params }: PageProps) {
  return <OrderDetailPage orderId={params.id} />
}