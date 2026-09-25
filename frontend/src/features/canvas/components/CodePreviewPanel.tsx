import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { X, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodePreviewPanelProps {
  code: { model_code: string; train_code: string; error?: string }
  onClose: () => void
}

export function CodePreviewPanel({ code, onClose }: CodePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'train'>('model')
  const [copied, setCopied] = useState(false)

  const currentCode = activeTab === 'model' ? code.model_code : code.train_code
  const fileName = activeTab === 'model' ? 'model.py' : 'train.py'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '1000px', height: '85vh', maxHeight: '800px' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">📄 生成的代码</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-layer-border items-center justify-between">
          <div className="flex">
            <button
              onClick={() => setActiveTab('model')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'model'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              model.py
            </button>
            <button
              onClick={() => setActiveTab('train')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'train'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              train.py
            </button>
          </div>
          <div className="px-4">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          {code.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm m-4">
              <strong>错误:</strong> {code.error}
            </div>
          ) : (
            <Editor
              height="100%"
              language="python"
              value={currentCode}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-layer-border flex items-center justify-between px-6 shrink-0">
          <span className="text-xs text-text-tertiary">{fileName} • 只读模式</span>
          <Button onClick={onClose} size="sm">
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}