import { memo, useState } from 'react'
import { BaseNode } from './BaseNode'
import type { LayerNode } from '@/types/graph'

function InputNodeComponent({ node }: { node: LayerNode }) {
  return <BaseNode node={node} />
}

export const InputNode = memo(InputNodeComponent)