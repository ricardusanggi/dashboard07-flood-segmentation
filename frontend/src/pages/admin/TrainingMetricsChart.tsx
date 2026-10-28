// path: frontend/src/pages/admin/TrainingMetricsChart.tsx

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from "recharts";

type MetricsData = {
  epoch: number[];
  train_loss: number[];
  val_loss: number[];
  train_iou?: number[];
  val_iou?: number[];
  train_dice?: number[];
  val_dice?: number[];
};

type Props = {
  data?: MetricsData | null;
};

export default function TrainingMetricsChart({ data }: Props) {
  if (!data || !data.epoch?.length) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
        Tidak ada data metrik training
      </div>
    );
  }

  const rows = useMemo(() => {
    return data.epoch.map((epoch, i) => ({
      epoch,
      train_loss:  data.train_loss?.[i]  ?? null,
      val_loss:    data.val_loss?.[i]    ?? null,
      train_iou:   data.train_iou?.[i]  ?? null,
      val_iou:     data.val_iou?.[i]    ?? null,
      train_dice:  data.train_dice?.[i] ?? null,
      val_dice:    data.val_dice?.[i]   ?? null,
    }));
  }, [data]);

  return (
    <div className="space-y-6">

      {/* LOSS */}
      <div className="w-full h-[260px]">
        <p className="text-xs font-semibold mb-2 text-gray-600">Loss</p>
        <ResponsiveContainer>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="train_loss" stroke="#6366f1" name="Train Loss" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="val_loss"   stroke="#22c55e" name="Val Loss"   strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* IoU */}
      {data.train_iou && (
        <div className="w-full h-[260px]">
          <p className="text-xs font-semibold mb-2 text-gray-600">IoU</p>
          <ResponsiveContainer>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="train_iou" stroke="#f97316" name="Train IoU" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="val_iou"   stroke="#06b6d4" name="Val IoU"   strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Dice */}
      {data.train_dice && (
        <div className="w-full h-[260px]">
          <p className="text-xs font-semibold mb-2 text-gray-600">Dice</p>
          <ResponsiveContainer>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="train_dice" stroke="#a855f7" name="Train Dice" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="val_dice"   stroke="#ec4899" name="Val Dice"   strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
