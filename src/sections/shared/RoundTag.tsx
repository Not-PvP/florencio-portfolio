/** Small "Round N" tag above section titles: a flat red block, like an arcade round counter. */
export default function RoundTag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        marginBottom: "14px",
        padding: "3px 10px",
        fontFamily: "var(--mk-font-body)",
        fontSize: "15px",
        fontWeight: 700,
        color: "#fff",
        background: "var(--mk-red)",
      }}
    >
      {label}
    </span>
  );
}
