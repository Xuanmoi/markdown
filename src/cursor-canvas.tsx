import type { CSSProperties, ReactNode } from "react";

type CommonProps = {
  children?: ReactNode;
  style?: CSSProperties;
};

const theme = {
  bg: {
    default: "#f7f8fb",
    elevated: "#ffffff",
  },
  fill: {
    secondary: "#eef6ff",
  },
  stroke: {
    primary: "#8ba0b8",
    secondary: "#d8e0ea",
  },
  text: {
    primary: "#162130",
    secondary: "#526173",
    tertiary: "#8a97a8",
  },
  accent: {
    primary: "#2563eb",
  },
};

export function useHostTheme() {
  return theme;
}

export function Stack({ children, gap = 12, style }: CommonProps & { gap?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Row({
  children,
  gap = 12,
  align = "stretch",
  style,
}: CommonProps & { gap?: number; align?: CSSProperties["alignItems"] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: align,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Grid({ children, columns = 2, gap = 12, style }: CommonProps & { columns?: number; gap?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: CommonProps & { variant?: string }) {
  return (
    <section
      style={{
        background: theme.bg.elevated,
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 8,
        boxShadow: "0 10px 24px rgba(22, 33, 48, 0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, style }: CommonProps) {
  return (
    <header
      style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${theme.stroke.secondary}`,
        color: theme.text.primary,
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </header>
  );
}

export function CardBody({ children, style }: CommonProps) {
  return <div style={{ padding: 16, ...style }}>{children}</div>;
}

export function H1({ children, style }: CommonProps) {
  return (
    <h1
      style={{
        margin: 0,
        color: theme.text.primary,
        fontSize: 34,
        lineHeight: 1.18,
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, style }: CommonProps) {
  return (
    <h2
      style={{
        margin: 0,
        color: theme.text.primary,
        fontSize: 22,
        lineHeight: 1.28,
        fontWeight: 750,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Text({
  children,
  tone,
  size,
  weight,
  style,
}: CommonProps & {
  tone?: "secondary" | "tertiary";
  size?: "small";
  weight?: "semibold" | "bold";
}) {
  return (
    <p
      style={{
        margin: 0,
        color: tone === "secondary" ? theme.text.secondary : tone === "tertiary" ? theme.text.tertiary : theme.text.primary,
        fontSize: size === "small" ? 13 : 15,
        lineHeight: 1.65,
        fontWeight: weight === "bold" ? 700 : weight === "semibold" ? 650 : 400,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Code({ children, style }: CommonProps) {
  return (
    <code
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        background: "#eef1f5",
        color: "#25364d",
        fontSize: "0.92em",
        ...style,
      }}
    >
      {children}
    </code>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: 0, borderTop: `1px solid ${theme.stroke.secondary}`, margin: "4px 0", ...style }} />;
}

export function Pill({ children, style }: CommonProps & { tone?: string; active?: boolean; size?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        padding: "2px 9px",
        borderRadius: 999,
        background: "#e8f1ff",
        color: "#174ea6",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Table({
  headers,
  rows,
  striped,
}: {
  headers: string[];
  rows: ReactNode[][];
  striped?: boolean;
}) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${theme.stroke.secondary}`, borderRadius: 8, background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  padding: "11px 12px",
                  textAlign: "left",
                  background: "#edf3fa",
                  borderBottom: `1px solid ${theme.stroke.secondary}`,
                  color: theme.text.primary,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ background: striped && rowIndex % 2 === 1 ? "#fafcff" : "#fff" }}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: "11px 12px",
                    borderBottom: rowIndex === rows.length - 1 ? 0 : `1px solid ${theme.stroke.secondary}`,
                    color: theme.text.secondary,
                    fontSize: 13,
                    lineHeight: 1.55,
                    verticalAlign: "top",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
