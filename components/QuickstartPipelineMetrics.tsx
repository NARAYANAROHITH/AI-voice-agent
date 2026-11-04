'use client';

export type QuickstartAgentMetric = {
  type: string;
  name: string;
  value: number;
  timestamp: number;
};

type QuickstartPipelineMetricsProps = {
  metrics: QuickstartAgentMetric[];
};

const PIPELINE = [
  { key: 'stt', label: 'Sarvam STT', metricTypes: ['stt', 'asr'] },
  { key: 'llm', label: 'Gemini LLM', metricTypes: ['llm', 'mllm'] },
  { key: 'tts', label: 'Sarvam TTS', metricTypes: ['tts'] },
] as const;

function formatMetricName(name: string) {
  return name.replace(/[_-]+/g, ' ');
}

export function QuickstartPipelineMetrics({
  metrics,
}: QuickstartPipelineMetricsProps) {
  const latestByType = new Map<string, QuickstartAgentMetric>();
  for (const metric of metrics) {
    latestByType.set(metric.type.toLowerCase(), metric);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="text-sm font-medium leading-6 text-muted-foreground">
        Pipeline
      </span>
      {PIPELINE.map((step, index) => {
        const metric = step.metricTypes
          .map((type) => latestByType.get(type))
          .find(Boolean);

        return (
          <div key={step.key} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-xs text-[#6B7280]" aria-hidden="true">
                /
              </span>
            )}
            <span className="rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-[11px] font-semibold leading-4 text-[#202124]">
              {step.label}
              {metric && (
                <span
                  className="ml-2 font-mono text-[#B45309]"
                  title={new Date(metric.timestamp).toLocaleTimeString()}
                >
                  {formatMetricName(metric.name)} {Math.round(metric.value)}ms
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
