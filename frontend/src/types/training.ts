export interface TrainConfig {
  dataset: string
  datasetType: 'builtin' | 'imagefolder' | 'csv' | 'numpy' | 'huggingface'
  datasetConfig?: DatasetConfig
  optimizer: string
  learningRate: number
  batchSize: number
  epochs: number
  lrScheduler?: string
  earlyStopping?: boolean
  patience?: number
  checkpointRestore?: boolean
}

export interface DatasetConfig {
  // ImageFolder
  trainDir?: string
  valDir?: string
  // CSV
  csvPath?: string
  imageColumn?: string
  labelColumn?: string
  // Numpy
  npyPath?: string
  xTrainKey?: string
  yTrainKey?: string
  xValKey?: string
  yValKey?: string
  // Hugging Face
  hfDatasetName?: string
  hfConfigName?: string
  hfSplit?: string
  hfImageColumn?: string
  hfLabelColumn?: string
}

export interface TrainStatus {
  isTraining: boolean
  currentEpoch: number
  totalEpochs: number
  currentStep: number
  totalSteps: number
  loss: number
  accuracy?: number
  logs: TrainLog[]
}

export interface TrainLog {
  epoch: number
  step: number
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: number
}