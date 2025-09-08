interface ZasilatConfig {
  apiKey: string;
  isTest?: boolean;
  baseUrl?: string;
}

interface ShippingRate {
  carrier: string;
  service: string;
  price: number;
  currency: string;
  delivery_days: number;
  pickup_points?: PickupPoint[];
}

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Shipment {
  id?: string;
  order_id: string;
  carrier: string;
  service: string;
  sender: Address;
  recipient: Address;
  package: Package;
  services?: string[];
  cod_amount?: number;
  insurance_amount?: number;
  reference?: string;
}

interface Address {
  name: string;
  street: string;
  city: string;
  postal_code: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface Package {
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  value?: number;
  description?: string;
}

interface ShipmentResponse {
  status: string;
  message: string;
  data?: {
    shipment_id: string;
    tracking_number: string;
    label_url?: string;
  };
  errors?: string[];
}

class ZasilatAPI {
  private config: ZasilatConfig;
  private baseUrl: string;

  constructor(config: ZasilatConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || (config.isTest 
      ? 'https://test.zaslat.cz/api/v1' 
      : 'https://www.zaslat.cz/api/v1');
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'POST', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-apikey': this.config.apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Zasilat API error:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates for a package
   */
  async getShippingRates(data: {
    sender_postal_code: string;
    recipient_postal_code: string;
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    cod_amount?: number;
    insurance_amount?: number;
  }): Promise<ShippingRate[]> {
    const result = await this.makeRequest('/rates/get', 'POST', data);
    return result.data || [];
  }

  /**
   * Create a new shipment
   */
  async createShipment(shipment: Shipment): Promise<ShipmentResponse> {
    return await this.makeRequest('/shipments/create', 'POST', shipment);
  }

  /**
   * Get shipment details
   */
  async getShipmentDetail(shipmentId: string): Promise<any> {
    return await this.makeRequest(`/shipments/detail?id=${shipmentId}`, 'GET');
  }

  /**
   * Get shipment label
   */
  async getShipmentLabel(shipmentId: string, format: 'pdf' | 'zpl' = 'pdf'): Promise<any> {
    return await this.makeRequest('/shipments/label', 'POST', {
      shipment_ids: [shipmentId],
      format
    });
  }

  /**
   * Track shipment status
   */
  async trackShipment(shipmentId: string): Promise<any> {
    return await this.makeRequest(`/shipments/tracking?id=${shipmentId}`, 'GET');
  }

  /**
   * List all shipments
   */
  async listShipments(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/shipments/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await this.makeRequest(endpoint, 'GET');
  }

  /**
   * Get pickup points for a carrier
   */
  async getPickupPoints(carrier: string, postalCode?: string): Promise<PickupPoint[]> {
    const data: any = { carrier };
    if (postalCode) {
      data.postal_code = postalCode;
    }

    const result = await this.makeRequest('/dropoff-points/list', 'POST', data);
    return result.data || [];
  }

  /**
   * Create inter-branch transfer shipment
   */
  async createTransfer(data: {
    items: Array<{
      sku: string;
      name: string;
      quantity: number;
    }>;
    from_location: 'chodov' | 'outlet';
    to_location: 'chodov' | 'outlet';
    notes?: string;
  }): Promise<ShipmentResponse> {
    // Define branch addresses
    const branches = {
      chodov: {
        name: 'Italské brašnářství - Chodov',
        street: 'Roztylská 2321/19',
        city: 'Praha',
        postal_code: '14800',
        phone: '+420 XXX XXX XXX',
        email: 'chodov@italskebrasnarstvi.cz'
      },
      outlet: {
        name: 'Italské brašnářství - Outlet',
        street: 'Outlet Address',
        city: 'Praha',
        postal_code: '10000',
        phone: '+420 XXX XXX XXX',
        email: 'outlet@italskebrasnarstvi.cz'
      }
    };

    const sender = branches[data.from_location];
    const recipient = branches[data.to_location];

    // Calculate total weight (estimate 0.5kg per item)
    const totalWeight = data.items.reduce((sum, item) => sum + (item.quantity * 0.5), 0);

    const shipment: Shipment = {
      order_id: `TRANSFER-${Date.now()}`,
      carrier: 'ppl', // Default carrier for transfers
      service: 'standard',
      sender,
      recipient,
      package: {
        weight: Math.max(totalWeight, 0.5), // Minimum 0.5kg
        description: `Převod zboží: ${data.items.map(item => `${item.name} (${item.quantity}ks)`).join(', ')}`
      },
      reference: data.notes || 'Interní převod mezi pobočkami',
      services: []
    };

    return await this.createShipment(shipment);
  }
}

// Export singleton instance
let zasilatAPI: ZasilatAPI | null = null;

export function getZasilatAPI(): ZasilatAPI {
  if (!zasilatAPI) {
    const apiKey = process.env.ZASILAT_API_KEY || process.env.NEXT_PUBLIC_ZASILAT_API_KEY;
    
    if (!apiKey) {
      throw new Error('Zasilat API key not configured. Please set ZASILAT_API_KEY environment variable.');
    }

    zasilatAPI = new ZasilatAPI({
      apiKey,
      isTest: process.env.NODE_ENV !== 'production'
    });
  }

  return zasilatAPI;
}

export type {
  ZasilatConfig,
  ShippingRate,
  PickupPoint,
  Shipment,
  Address,
  Package,
  ShipmentResponse
};

export { ZasilatAPI };