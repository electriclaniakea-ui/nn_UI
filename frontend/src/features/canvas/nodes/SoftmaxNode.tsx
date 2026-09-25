import { memo } from 'react'
import { BaseNode } from './BaseNode'
import type { LayerNode } from '@/types/graph'

export const SoftmaxNode = memo(({ node }: { node: LayerNode }) => <BaseNode node={node} />)