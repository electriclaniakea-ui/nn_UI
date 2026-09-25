import { memo } from 'react'
import { BaseNode } from './BaseNode'
import type { LayerNode } from '@/types/graph'

export const Conv2dNode = memo(({ node }: { node: LayerNode }) => <BaseNode node={node} />)