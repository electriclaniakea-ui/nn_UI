import { memo, useState } from 'react';
import type { LayerNode } from '@/types/graph';
import { useCanvasStore } from '@/features/canvas/store/canvasStore';

interface DiamondNodeProps {
  node: LayerNode;
  isInput?: boolean;
  isOutput?: boolean;
}

function DiamondNodeComponent({ node, isInput = false, isOutput = false }: DiamondNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { selectNode, removeNode } = useCanvasStore();
  
  const { data } = node;
  const hasError = data.hasError;

  const handleClick = () => {
    if (!isInput && !isOutput) {
      selectNode(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isInput && !isOutput) {
      removeNode(node.id);
    }
  };

  if (isInput || isOutput) {
    return (
      <div
        style={{
          width: 64,
          height: 64,
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          style={{
            transition: 'transform 150ms ease-out',
            filter: isHovered ? 'drop-shadow(var(--shadow-hover))' : 'drop-shadow(var(--shadow-soft))',
            transform: `${isHovered ? 'scale(1.08) ' : ''}${isOutput ? '' : 'rotate(180deg)'}`,
          }}
        >
          <defs>
            <linearGradient id={`triangle-grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--layer-top)" />
              <stop offset="100%" stopColor="var(--layer-bottom)" />
            </linearGradient>
          </defs>
          <polygon
            points="32,4 60,32 32,60 4,32"
            fill={`url(#triangle-grad-${node.id})`}
            stroke="var(--layer-border)"
            strokeWidth={1}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isInput ? 'Input' : 'Output'}
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
            {data.params.shape?.join('×') || ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 80,
        height: 80,
        position: 'relative',
        cursor: 'pointer',
        zIndex: 100 - data.index,
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={hasError ? 'error-flash' : ''}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{
          transform: `rotate(45deg) ${isHovered ? 'scale(1.08)' : ''}`,
          transition: 'transform 150ms ease-out',
          filter: isHovered 
            ? 'var(--shadow-hover)' 
            : 'var(--shadow-soft)',
        }}
      >
        <defs>
          <linearGradient id={`diamond-grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--layer-top)" />
            <stop offset="100%" stopColor="var(--layer-bottom)" />
          </linearGradient>
        </defs>
        <rect
          x="8"
          y="8"
          width="64"
          height="64"
          rx={4}
          fill={`url(#diamond-grad-${node.id})`}
          stroke={hasError ? 'var(--error)' : 'var(--layer-border)'}
          strokeWidth={1.5}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(0deg)',
          textAlign: 'center',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {data.type === 'concat' || data.type === 'add' ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)', lineHeight: 1 }}>
              {data.type === 'concat' ? '⊕' : '+'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
              {data.label}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
              {data.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {getParamDisplay(data.type, data.params)}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
              #{data.index}
            </div>
          </>
        )}
      </div>

      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'var(--error)',
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          ⚠
        </div>
      )}
    </div>
  );
}

function getParamDisplay(type: string, params: Record<string, any>): string {
  switch (type) {
    case 'linear':
      return `${params.in_features}→${params.out_features}`;
    case 'conv2d':
      return `${params.in_channels}→${params.out_channels}`;
    case 'lstm':
    case 'gru':
      return `${params.input_size}→${params.hidden_size}`;
    case 'embedding':
      return `${params.num_embeddings}×${params.embedding_dim}`;
    case 'multihead_attention':
      return `${params.embed_dim}/${params.num_heads}`;
    case 'transformer_encoder':
      return `${params.d_model}×${params.num_layers}`;
    default:
      return '';
  }
}

export const DiamondNode = memo(DiamondNodeComponent);