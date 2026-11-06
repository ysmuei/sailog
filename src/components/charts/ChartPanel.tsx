import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, ArrowRight, Table2 } from "lucide-react";
import { number } from "../../lib/date";
import { Button } from "../ui/Button";

export type ChartPoint = { label: string; a: number | null; b: number | null };
export function ChartPanel({
  title,
  subtitle,
  data,
  names,
  type = "area",
  unit = "개",
  children,
}: {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  names: [string, string];
  type?: "area" | "bar";
  unit?: string;
  children?: React.ReactNode;
}) {
  const [page, setPage] = useState(0);
  const gradientId = useId().replace(/:/g, "");
  const safePage = Math.min(page, Math.max(0, Math.ceil(data.length / 30) - 1));
  const common = {
    data,
    margin: { top: 14, right: 8, left: -20, bottom: 0 },
    accessibilityLayer: true,
  };
  const frame = (
    <>
      <CartesianGrid
        stroke="var(--border)"
        vertical={false}
        strokeDasharray="3 5"
      />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        minTickGap={36}
        tick={{ fill: "var(--muted)", fontSize: 11 }}
        tickFormatter={(label) =>
          /^\d{4}-\d{2}-\d{2}$/.test(label)
            ? label.slice(5).replace("-", "/")
            : label
        }
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "var(--muted)", fontSize: 11 }}
        allowDecimals={unit !== "분"}
      />
      <Tooltip
        contentStyle={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          color: "var(--ink)",
          fontSize: 13,
        }}
        formatter={(value) => `${number(Number(value))}${unit}`}
      />
      <Legend iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
    </>
  );
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
      <div
        className="chart-frame"
        role="group"
        aria-label={`${title}. 방향키로 그래프를 탐색하거나 아래 데이터 표를 확인하세요.`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {type === "area" ? (
            <AreaChart {...common}>
              {frame}
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="var(--chart-a)" stopOpacity={0.15} />
                  <stop offset="1" stopColor="var(--chart-a)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                name={`A · ${names[0]}`}
                dataKey="a"
                type="monotone"
                stroke="var(--chart-a)"
                fill={`url(#${gradientId})`}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
              <Area
                name={`B · ${names[1]}`}
                dataKey="b"
                type="monotone"
                stroke="var(--chart-b)"
                fill="transparent"
                strokeWidth={2.5}
                strokeDasharray="5 4"
                isAnimationActive={false}
              />
            </AreaChart>
          ) : (
            <BarChart {...common}>
              {frame}
              <Bar
                name={`A · ${names[0]}`}
                dataKey="a"
                fill="var(--chart-a)"
                radius={[3, 3, 0, 0]}
                maxBarSize={20}
                isAnimationActive={false}
              />
              <Bar
                name={`B · ${names[1]}`}
                dataKey="b"
                fill="var(--chart-b)"
                radius={[3, 3, 0, 0]}
                maxBarSize={20}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <details className="data-details">
        <summary>
          <Table2 size={14} aria-hidden="true" /> 데이터 표로 보기
        </summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              {title} 데이터 ({unit})
            </caption>
            <thead>
              <tr>
                <th scope="col">기간 / 구간</th>
                <th scope="col">{names[0]}</th>
                <th scope="col">{names[1]}</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(safePage * 30, safePage * 30 + 30).map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>
                    {row.a === null ? "기록 없음" : number(row.a)}
                    {row.a === null ? "" : unit}
                  </td>
                  <td>
                    {row.b === null ? "기록 없음" : number(row.b)}
                    {row.b === null ? "" : unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 30 && (
          <div className="pagination">
            <Button
              variant="ghost"
              aria-label="이전 데이터"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </Button>
            <span>
              {safePage + 1} / {Math.ceil(data.length / 30)} 페이지
            </span>
            <Button
              variant="ghost"
              aria-label="다음 데이터"
              disabled={(safePage + 1) * 30 >= data.length}
              onClick={() => setPage(safePage + 1)}
            >
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        )}
      </details>
    </section>
  );
}
