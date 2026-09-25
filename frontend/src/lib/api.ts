import type { LayerSpec } from '@/types/layer'
import type { CanvasNode } from '@/features/canvas/store/canvasStore'

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8765'

interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`)
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` }
      }
      const data = await response.json()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    }
  }

  async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` }
      }
      const data = await response.json()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    }
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` }
      }
      const data = await response.json()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: (error as Error).message }
    }
  }
}

export const api = new ApiClient(API_BASE)
export type { ApiResponse }

// === Layer API ===
export async function fetchLayers(): Promise<LayerSpec[]> {
  const res = await api.get<LayerSpec[]>('/api/layers')
  return res.ok ? (res.data || []) : []
}

// === Graph API ===
export interface NodeShapeInfo {
  node_index: number
  node_type: string
  input_shape: number[]
  output_shape: number[]
  error?: string
}

export interface GraphValidationResult {
  errors: Array<{
    node_index: number
    node_type: string
    error: string
  }>
  output_shape: number[] | null
  node_shapes: NodeShapeInfo[]
}

export async function validateGraph(nodes: CanvasNode[]): Promise<GraphValidationResult & { requestError?: string }> {
  const res = await api.post<GraphValidationResult>('/api/graph', {
    nodes: nodes.map(n => {
      const params: Record<string, any> = { ...n.data.params }
      return {
        id: n.id,
        type: n.type,
        data: { type: n.type, params }
      }
    }),
    edges: []
  })
  if (res.ok) {
    return res.data || { errors: [], output_shape: null, node_shapes: [] }
  }
  // 请求失败时返回特殊标记，不映射到任何节点
  return { errors: [], output_shape: null, node_shapes: [], requestError: res.error || '验证失败' }
}

// === CodeGen API ===
export interface CodeGenResult {
  model_code: string
  train_code: string
  error?: string
}

export async function generateCode(nodes: CanvasNode[]): Promise<CodeGenResult> {
  const res = await api.post<CodeGenResult>('/api/codegen', { nodes })
  return res.ok
    ? (res.data || { model_code: '', train_code: '', error: res.error })
    : { model_code: '', train_code: '', error: res.error || '代码生成失败' }
}

// === Project API ===
export interface ProjectMeta {
  name: string
  path: string
  node_count: number
  updated_at: string
  is_example: boolean
}

export interface ProjectData {
  version: string
  name: string
  description?: string
  saved_at: string
  nodes: any[]
  edges: any[]
  is_example?: boolean
}

export async function listProjects(): Promise<{ projects: ProjectMeta[]; project_dir: string }> {
  const res = await api.get<{ projects: ProjectMeta[]; project_dir: string }>('/api/projects')
  return res.ok
    ? { projects: res.data?.projects || [], project_dir: res.data?.project_dir || '' }
    : { projects: [], project_dir: '' }
}

export async function getProjectPath(): Promise<string> {
  const res = await api.get<{ project_dir: string }>('/api/projects/path')
  return res.ok ? (res.data?.project_dir || '') : ''
}

export async function setProjectPath(path: string): Promise<boolean> {
  const res = await api.post<{ success: boolean }>('/api/projects/path', { path })
  return res.ok ? (res.data?.success || false) : false
}

export async function saveProject(name: string, nodes: CanvasNode[], description: string = ''): Promise<{ path: string } | null> {
  const res = await api.post<{ path: string }>('/api/projects', { name, nodes, edges: [], description })
  return res.ok ? (res.data || null) : null
}

export async function loadProject(projectName: string): Promise<ProjectData | null> {
  const res = await api.get<ProjectData>(`/api/projects/${encodeURIComponent(projectName)}`)
  return res.ok ? (res.data || null) : null
}

export async function deleteProject(projectName: string): Promise<boolean> {
  const res = await api.delete<{ success: boolean }>(`/api/projects/${encodeURIComponent(projectName)}`)
  return res.ok ? (res.data?.success || false) : false
}

export async function renameProject(projectName: string, newName: string): Promise<{ success: boolean; new_name?: string } | null> {
  const res = await api.post<{ success: boolean; new_name: string }>(`/api/projects/${encodeURIComponent(projectName)}/rename`, { new_name: newName })
  return res.ok ? (res.data || null) : null
}

export async function duplicateProject(projectName: string): Promise<{ success: boolean; new_name?: string } | null> {
  const res = await api.post<{ success: boolean; new_name: string }>(`/api/projects/${encodeURIComponent(projectName)}/duplicate`, {})
  return res.ok ? (res.data || null) : null
}

// === System API ===
export interface SystemInfo {
  version: string
  device: string
  cuda_available: boolean
  cuda_device_name: string | null
  pytorch_version: string
}

export async function getSystemInfo(): Promise<SystemInfo | null> {
  const res = await api.get<SystemInfo>('/api/system')
  return res.ok ? (res.data || null) : null
}

export async function shutdownBackend(): Promise<{ status: string } | null> {
  const res = await api.post<{ status: string }>('/api/system/shutdown', {})
  return res.ok ? (res.data || null) : null
}

// === Training API ===
export interface TrainConfig {
  dataset: string
  dataset_type?: string
  dataset_config?: any
  optimizer: string
  learning_rate: number
  batch_size: number
  epochs: number
  lr_scheduler?: string
  early_stopping: boolean
  patience: number
  loss_function?: string
  weight_decay?: number
  graph_nodes?: any[]
}

export interface TrainLog {
  epoch: number
  step: number
  loss: number
  accuracy: number
  learningRate: number
  level: string
  message: string
  timestamp: string
}

export interface TrainStatus {
  isTraining: boolean
  currentEpoch: number
  totalEpochs: number
  currentStep: number
  totalSteps: number
  loss: number
  accuracy: number
  trainId: string | null
  logs: TrainLog[]
}

export async function startTraining(config: TrainConfig): Promise<{ train_id: string; status: string } | { error: string; status: string } | null> {
  const res = await api.post<{ train_id: string; status: string } | { error: string; status: string }>('/api/training/start', config)
  return res.ok ? (res.data || null) : null
}

export async function stopTraining(): Promise<{ status: string } | null> {
  const res = await api.post<{ status: string }>('/api/training/stop', {})
  return res.ok ? (res.data || null) : null
}

export async function getTrainingStatus(): Promise<TrainStatus | null> {
  const res = await api.get<TrainStatus>('/api/training/status')
  return res.ok ? (res.data || null) : null
}

export interface LRSchedulePoint {
  step: number
  lr: number
}

export async function getLRSchedulePreview(
  scheduler: string,
  epochs: number,
  stepsPerEpoch: number,
  initialLR: number
): Promise<LRSchedulePoint[] | null> {
  const res = await api.post<LRSchedulePoint[]>('/api/training/lr-preview', {
    scheduler,
    epochs,
    steps_per_epoch: stepsPerEpoch,
    initial_lr: initialLR,
  })
  return res.ok ? (res.data || null) : null
}

export async function exportModel(
  format: 'onnx' | 'torchscript',
  outputPath?: string
): Promise<{ path: string; format: string; input_shape: number[]; num_classes: number } | { error: string } | null> {
  const res = await api.post<{ path: string; format: string; input_shape: number[]; num_classes: number } | { detail: string }>('/api/training/export', {
    format,
    output_path: outputPath,
  })
  if (!res.ok) {
    const errorData = res.data as { detail?: string }
    return { error: errorData?.detail || '导出失败' }
  }
  return res.data || null
}

// ==================== App Data API ====================

export async function getAppData<T = any>(key: string): Promise<T | null> {
  const res = await api.get<{ key: string; data: T }>(`/api/projects/app-data/${encodeURIComponent(key)}`)
  return res.ok ? (res.data?.data || null) : null
}

export async function saveAppData(key: string, data: any): Promise<boolean> {
  const res = await api.post<{ success: boolean }>(`/api/projects/app-data/${encodeURIComponent(key)}`, {
    key,
    data,
  })
  return res.ok ? (res.data?.success || false) : false
}

export async function deleteAppData(key: string): Promise<boolean> {
  const res = await api.delete<{ success: boolean }>(`/api/projects/app-data/${encodeURIComponent(key)}`)
  return res.ok ? (res.data?.success || false) : false
}