export interface BlockSchema {
  id: string
  name: string
  nodes: string[]
  inputPorts: number
  outputPorts: number
  isCollapsed: boolean
}

export interface BlockInfo {
  name: string
  description?: string
  layerCount: number
  createdAt: string
  updatedAt: string
}