import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface TrainingLog {
  epoch: number
  step: number
  loss?: number
  accuracy?: number
  learningRate?: number
}

interface TrainingChartsProps {
  logs: TrainingLog[]
}

export function TrainingCharts({ logs }: TrainingChartsProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary text-sm">
        等待训练数据...
      </div>
    )
  }

  // 过滤掉没有 loss 的日志，使用 step 作为 X 轴
  const stepData = logs
    .filter(log => typeof log.loss === 'number' && !isNaN(log.loss))
    .map((log, index) => ({
      step: index + 1,
      epoch: log.epoch,
      loss: log.loss,
      accuracy: (log.accuracy || 0) * 100,
      learningRate: log.learningRate || 0,
    }))

  if (stepData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary text-sm">
        暂无训练数据...
      </div>
    )
  }

  // 计算 Loss 的合理范围
  const allLoss = stepData.map(d => d.loss).filter((v): v is number => typeof v === 'number' && !isNaN(v))
  const minLoss = allLoss.length > 0 ? Math.min(...allLoss) : 0
  const maxLoss = allLoss.length > 0 ? Math.max(...allLoss) : 1
  // 给 Y 轴留 10% 边距
  const lossPadding = (maxLoss - minLoss) * 0.1 || 0.1
  const lossDomain: [number | string, number | string] = [
    Math.max(0, minLoss - lossPadding),
    maxLoss + lossPadding,
  ]

  return (
    <div className="space-y-4">
      {/* Loss 曲线 */}
      <div className="border border-layer-border rounded-lg p-4 bg-bg-canvas">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Loss 曲线</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stepData}>
            <defs>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="step"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              label={{ value: 'Step', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              domain={lossDomain}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F9FAFB',
              }}
              formatter={(value: any) => [Number(value).toFixed(6), 'Loss']}
              labelFormatter={(label: any) => `Step ${label}`}
            />
            <Area
              type="monotone"
              dataKey="loss"
              stroke="#7C3AED"
              fillOpacity={1}
              fill="url(#lossGradient)"
              strokeWidth={2}
              dot={false}
              name="Loss"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy 曲线 */}
      <div className="border border-layer-border rounded-lg p-4 bg-bg-canvas">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Accuracy 曲线</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stepData}>
            <defs>
              <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="step"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              label={{ value: 'Step', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              domain={[0, 100]}
              unit="%"
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F9FAFB',
              }}
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Accuracy']}
              labelFormatter={(label: any) => `Step ${label}`}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#accGradient)"
              strokeWidth={2}
              dot={false}
              name="Accuracy"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 双Y轴组合图 */}
      <div className="border border-layer-border rounded-lg p-4 bg-bg-canvas">
        <h4 className="text-sm font-semibold text-text-primary mb-3">训练概览</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stepData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="step"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              label={{ value: 'Step', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis
              yAxisId="loss"
              orientation="left"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              domain={lossDomain}
              width={60}
            />
            <YAxis
              yAxisId="acc"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              domain={[0, 100]}
              unit="%"
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F9FAFB',
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Loss') return [Number(value).toFixed(6), name]
                return [`${Number(value).toFixed(2)}%`, name]
              }}
              labelFormatter={(label: any) => `Step ${label}`}
            />
            <Legend />
            <Line
              yAxisId="loss"
              type="monotone"
              dataKey="loss"
              stroke="#7C3AED"
              strokeWidth={2}
              dot={false}
              name="Loss"
            />
            <Line
              yAxisId="acc"
              type="monotone"
              dataKey="accuracy"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="Accuracy (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}