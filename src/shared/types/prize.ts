export interface Prize {
  id: string
  name: string
  probability: number
  description?: string
  imageUrl?: string
  code?: string
}

export interface PrizeResult {
  prize: Prize | null
  won: boolean
}
