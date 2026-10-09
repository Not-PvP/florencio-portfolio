/** Small "ROUND N" pill used above section titles, matching the Projects header. */
export default function RoundTag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(232,40,60,0.1)",
        border: "1px solid rgba(232,40,60,0.3)",
        padding: "4px 12px",
        borderRadius: "20px",
        marginBottom: "14px",
        fontFamily: "'Space Mono', monospace",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.3em",
        color: "#ff6b7a",
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e8283c", boxShadow: "0 0 8px #e8283c" }}
      />
      {label}
    </span>
  );
}
