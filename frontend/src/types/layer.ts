export interface ParamSpec {
  name: string
  type: 'int' | 'float' | 'bool' | 'str' | 'select' | 'tuple'
  default: any
  min?: number
  max?: number
  options?: string[]
  label?: string
}

export interface LayerSpec {
  type: string
  display: string
  category: string
  color: string
  inputs: string[]
  outputs: string[]
  params: ParamSpec[]
}

export interface LayerSchema {
  type: string
  params: Record<string, any>
}