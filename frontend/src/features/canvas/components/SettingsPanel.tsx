import { useState, useEffect } from 'react'
import { X, Monitor, Keyboard, Database, RotateCcw, FolderOpen, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProjectPath, setProjectPath, getAppData, saveAppData } from '@/lib/api'
import { BinaryWaveArt } from './BinaryWaveArt'

export interface AppSettings {
  autoSave: boolean
  autoSaveInterval: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  nodeSize: number
  showTooltips: boolean
  confirmBeforeDelete: boolean
  maxHistorySteps: number
  exportFormat: 'json' | 'python'
  backendUrl: string
  projectDir: string
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  autoSaveInterval: 500,
  showGrid: true,
  snapToGrid: false,
  gridSize: 20,
  nodeSize: 80,
  showTooltips: true,
  confirmBeforeDelete: true,
  maxHistorySteps: 50,
  exportFormat: 'json',
  backendUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765',
  projectDir: '',
}

const SETTINGS_KEY = 'settings'

export async function loadSettings(): Promise<AppSettings> {
  try {
    const saved = await getAppData<AppSettings>(SETTINGS_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...saved }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await saveAppData(SETTINGS_KEY, settings)
  } catch {
    // ignore
  }
}

interface SettingsPanelProps {
  onClose: () => void
}

type TabKey = 'general' | 'canvas' | 'shortcuts' | 'projects' | 'info'

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const [saved, setSaved] = useState(false)
  const [projectPathInput, setProjectPathInput] = useState('')
  const [pathSaving, setPathSaving] = useState(false)

  // 加载设置
  useEffect(() => {
    loadSettings().then(s => {
      setSettings(s)
      setProjectPathInput(s.projectDir)
      setLoaded(true)
    })
  }, [])

  // 加载时获取后端项目路径
  useEffect(() => {
    if (!loaded) return
    getProjectPath().then(path => {
      if (path && path !== settings.projectDir) {
        setProjectPathInput(path)
        const next = { ...settings, projectDir: path }
        setSettings(next)
        saveSettings(next)
      }
    })
  }, [loaded])

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    await saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleReset = async () => {
    if (window.confirm('确定要恢复默认设置吗？')) {
      setSettings({ ...DEFAULT_SETTINGS })
      await saveSettings({ ...DEFAULT_SETTINGS })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  const handleProjectPathChange = async () => {
    setPathSaving(true)
    const success = await setProjectPath(projectPathInput)
    if (success) {
      await updateSetting('projectDir', projectPathInput)
    } else {
      alert('设置项目路径失败，请检查路径是否有效')
    }
    setPathSaving(false)
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: '通用', icon: <Database className="h-4 w-4" /> },
    { key: 'canvas', label: '画布', icon: <Monitor className="h-4 w-4" /> },
    { key: 'shortcuts', label: '快捷键', icon: <Keyboard className="h-4 w-4" /> },
    { key: 'projects', label: '项目', icon: <FolderOpen className="h-4 w-4" /> },
    { key: 'info', label: '信息', icon: <Info className="h-4 w-4" /> },
  ]

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        className="bg-bg-panel rounded-xl shadow-2xl flex flex-col animate-zoom-in"
        style={{ width: '90vw', maxWidth: '640px', height: '80vh', maxHeight: '560px' }}
      >
        {/* Header */}
        <div className="h-14 border-b border-layer-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">⚙️ 设置</h2>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-success bg-green-50 px-2 py-1 rounded">已保存</span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r border-layer-border flex flex-col py-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${
                  activeTab === tab.key
                    ? 'text-accent bg-accent/5 border-r-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-canvas'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-red-50 transition-colors text-left mx-2 rounded-md"
            >
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </button>
          </div>

          {/* Panel */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Section title="自动保存">
                  <ToggleRow
                    label="启用自动保存"
                    desc="定期自动保存画布状态到本地文件"
                    checked={settings.autoSave}
                    onChange={(v) => updateSetting('autoSave', v)}
                  />
                  {settings.autoSave && (
                    <div className="mt-3 ml-7">
                      <label className="text-sm text-text-secondary">保存间隔 (ms)</label>
                      <input
                        type="number"
                        min={100}
                        max={5000}
                        step={100}
                        value={settings.autoSaveInterval}
                        onChange={(e) => updateSetting('autoSaveInterval', Number(e.target.value))}
                        className="mt-1 w-32 px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </Section>

                <Section title="操作确认">
                  <ToggleRow
                    label="删除前确认"
                    desc="删除节点或清空画布时弹出确认对话框"
                    checked={settings.confirmBeforeDelete}
                    onChange={(v) => updateSetting('confirmBeforeDelete', v)}
                  />
                </Section>

                <Section title="历史记录">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">最大历史步数</div>
                      <div className="text-xs text-text-tertiary">撤销/重做的最大步数限制</div>
                    </div>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      step={10}
                      value={settings.maxHistorySteps}
                      onChange={(e) => updateSetting('maxHistorySteps', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </Section>

                <Section title="导出">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">默认导出格式</div>
                      <div className="text-xs text-text-tertiary">代码预览的默认格式</div>
                    </div>
                    <select
                      value={settings.exportFormat}
                      onChange={(e) => updateSetting('exportFormat', e.target.value as 'json' | 'python')}
                      className="px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="json">JSON</option>
                      <option value="python">Python</option>
                    </select>
                  </div>
                </Section>

                <Section title="后端服务">
                  <div>
                    <label className="text-sm text-text-secondary">后端 API 地址</label>
                    <input
                      type="text"
                      value={settings.backendUrl}
                      onChange={(e) => updateSetting('backendUrl', e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                      placeholder={import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765'}
                    />
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'canvas' && (
              <div className="space-y-6">
                <Section title="网格">
                  <ToggleRow
                    label="显示网格"
                    desc="在画布背景上显示对齐网格"
                    checked={settings.showGrid}
                    onChange={(v) => updateSetting('showGrid', v)}
                  />
                  <ToggleRow
                    label="对齐网格"
                    desc="拖拽节点时自动吸附到网格"
                    checked={settings.snapToGrid}
                    onChange={(v) => updateSetting('snapToGrid', v)}
                  />
                  <div className="mt-3 ml-7">
                    <label className="text-sm text-text-secondary">网格大小 (px)</label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      value={settings.gridSize}
                      onChange={(e) => updateSetting('gridSize', Number(e.target.value))}
                      className="mt-1 w-24 px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </Section>

                <Section title="节点">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-text-primary">节点大小 (px)</div>
                      <div className="text-xs text-text-tertiary">调整节点的默认显示大小</div>
                    </div>
                    <input
                      type="number"
                      min={40}
                      max={120}
                      step={4}
                      value={settings.nodeSize}
                      onChange={(e) => updateSetting('nodeSize', Number(e.target.value))}
                      className="w-20 px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </Section>

                <Section title="提示">
                  <ToggleRow
                    label="显示悬停提示"
                    desc="鼠标悬停在节点上时显示详细信息"
                    checked={settings.showTooltips}
                    onChange={(v) => updateSetting('showTooltips', v)}
                  />
                </Section>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <Section title="画布操作">
                  <ShortcutRow keys={['Ctrl', 'Z']} desc="撤销" />
                  <ShortcutRow keys={['Ctrl', 'Y']} desc="重做" />
                  <ShortcutRow keys={['Ctrl', 'S']} desc="手动保存" />
                  <ShortcutRow keys={['Delete']} desc="删除选中节点" />
                  <ShortcutRow keys={['Ctrl', 'D']} desc="复制选中节点" />
                </Section>
                <Section title="选择操作">
                  <ShortcutRow keys={['Ctrl', 'Click']} desc="多选节点" />
                  <ShortcutRow keys={['Esc']} desc="取消选择 / 关闭弹窗" />
                </Section>
                <Section title="项目管理">
                  <ShortcutRow keys={['Enter']} desc="打开选中项目" />
                  <ShortcutRow keys={['F2']} desc="重命名项目" />
                  <ShortcutRow keys={['Ctrl', 'C']} desc="复制项目" />
                  <ShortcutRow keys={['Delete']} desc="删除项目" />
                </Section>
                <Section title="Block 操作">
                  <ShortcutRow keys={['Double Click']} desc="编辑 Block" />
                  <ShortcutRow keys={['Right Click']} desc="打开上下文菜单" />
                </Section>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <Section title="项目目录">
                  <div>
                    <label className="text-sm text-text-secondary">项目文件保存路径</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={projectPathInput}
                        onChange={(e) => setProjectPathInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-bg-canvas border border-layer-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                        placeholder="例如: D:/nn_UI/projects"
                      />
                      <button
                        onClick={handleProjectPathChange}
                        disabled={pathSaving}
                        className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {pathSaving ? '保存中...' : '保存'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-text-tertiary">
                      修改后，项目文件将保存到新路径。示例工程也会复制到新目录。
                    </p>
                  </div>
                </Section>

                <Section title="当前路径">
                  <div className="px-3 py-2 bg-bg-canvas border border-layer-border rounded-md">
                    <code className="text-xs text-text-secondary break-all">{settings.projectDir || '未设置'}</code>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-6">
                <Section title="关于">
                  <div className="text-sm text-text-secondary">
                    <p>nn_UI - Visual Neural Network Builder</p>
                    <p className="mt-1">可视化神经网络构建工具</p>
                  </div>
                </Section>

                <Section title="版本">
                  <div className="text-sm text-text-secondary">
                    <p>前端版本: 1.0.0</p>
                    <p className="mt-1">后端版本: 1.0.0</p>
                  </div>
                </Section>

                <Section title="艺术图像">
                  <BinaryWaveArt />
                </Section>

                <Section title="开源">
                  <div className="text-sm text-text-secondary">
                    <p>本项目基于 MIT 协议开源</p>
                    <p className="mt-1 text-text-tertiary">后续可在此添加更多项目信息、贡献者列表、第三方库声明等。</p>
                  </div>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        <div className="text-xs text-text-tertiary">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-layer-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-primary">{desc}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-bg-canvas border border-layer-border rounded text-xs text-text-secondary font-mono">
              {k}
            </kbd>
            {i < keys.length - 1 && <span className="text-text-tertiary text-xs">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}