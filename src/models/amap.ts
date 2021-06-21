export interface Amap {
  status: string
  regeocode: Regeocode
  info: string
  infocode: string
}

export interface Regeocode {
  addressComponent: AddressComponent
  formattedAddress: string
}

export interface AddressComponent {
  city: string
  province: string
  adcode: string
  district: string
  towncode: string
  streetNumber: StreetNumber
  country: string
  township: string
  businessAreas: BusinessArea[]
  building: Building
  neighborhood: Building
  citycode: string
}

export interface Building {
  name: any[]
  type: any[]
}

export interface BusinessArea {
  location: string
  name: string
  id: string
}

export interface StreetNumber {
  number: string
  location: string
  direction: string
  distance: string
  street: string
}
