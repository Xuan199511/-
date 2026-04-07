import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "food", label: "餐飲", icon: "🍜", color: "#FF6B6B" },
  { id: "transport", label: "交通", icon: "🚇", color: "#4ECDC4" },
  { id: "shop", label: "購物", icon: "🛍️", color: "#FFE66D" },
  { id: "entertain", label: "娛樂", icon: "🎮", color: "#A855F7" },
  { id: "health", label: "醫療", icon: "💊", color: "#06B6D4" },
  { id: "bill", label: "帳單", icon: "📄", color: "#F97316" },
  { id: "other", label: "其他", icon: "📦", color: "#94A3B8" },
];

const TYPES = [
  { id: "expense", label: "支出", icon: "↑" },
  { id: "income", label: "收入", icon: "↓" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMoney(n) {
  return Math.abs(n).toLocaleString("zh-TW");
}

export default function App() {
  const [records, setRecords] = useState(() => {
    try {
      const s = localStorage.getItem("expense_records");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [view, setView] = useState("list"); // list | stats

  // Form state
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const amountRef = useRef();

  useEffect(() => {
    try { localStorage.setItem("expense_records", JSON.stringify(records)); } catch {}
  }, [records]);

  useEffect(() => {
    if (showForm && amountRef.current) amountRef.current.focus();
  }, [showForm]);

  function addRecord() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const cat = CATEGORIES.find(c => c.id === category);
    setRecords(prev => [{
      id: Date.now(),
      type,
      amount: Number(amount),
      category,
      catLabel: cat.label,
      catIcon: cat.icon,
      catColor: cat.color,
      note,
      date,
    }, ...prev]);
    setAmount("");
    setNote("");
    setShowForm(false);
  }

  function deleteRecord(id) {
    setRecords(prev => prev.filter(r => r.id !== id));
  }

  const filtered = filterCat === "all" ? records : records.filter(r => r.category === filterCat);

  const totalIncome = records.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpense = records.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  // Stats: spending by category
  const catStats = CATEGORIES.map(cat => {
    const total = records.filter(r => r.type === "expense" && r.category === cat.id).reduce((s, r) => s + r.amount, 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const maxCat = catStats.length ? catStats[0].total : 1;

  // Group records by date
  const grouped = {};
  filtered.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F1A",
      fontFamily: "'Noto Sans TC', 'PingFang TC', sans-serif",
      color: "#E8E8F0",
      display: "flex",
      flexDirection: "column",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
        padding: "28px 24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>我的帳本</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>
              {balance >= 0 ? "+" : ""}
              <span style={{ color: balance >= 0 ? "#4ADE80" : "#F87171" }}>
                NT$ {formatMoney(balance)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none", cursor: "pointer",
              fontSize: 24, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              transition: "transform 0.15s",
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >+</button>
        </div>

        {/* Income / Expense Summary */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "總收入", value: totalIncome, color: "#4ADE80", bg: "rgba(74,222,128,0.1)" },
            { label: "總支出", value: totalExpense, color: "#F87171", bg: "rgba(248,113,113,0.1)" },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, background: item.bg,
              borderRadius: 12, padding: "10px 14px",
              border: `1px solid ${item.bg}`,
            }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: item.color }}>
                NT$ {formatMoney(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", background: "#1A1A2E",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {[{ id: "list", label: "明細" }, { id: "stats", label: "統計" }].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{
            flex: 1, padding: "12px 0", border: "none", background: "transparent",
            color: view === tab.id ? "#818CF8" : "#6B7280",
            fontWeight: view === tab.id ? 700 : 400,
            fontSize: 14, cursor: "pointer",
            borderBottom: view === tab.id ? "2px solid #818CF8" : "2px solid transparent",
            transition: "all 0.2s",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div style={{ flex: 1, overflow: "auto", padding: "16px 0" }}>
          {/* Category Filter */}
          <div style={{ display: "flex", gap: 8, padding: "0 16px 16px", overflowX: "auto" }}>
            <button onClick={() => setFilterCat("all")} style={pillStyle(filterCat === "all")}>全部</button>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFilterCat(c.id)} style={pillStyle(filterCat === c.id, c.color)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {sortedDates.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4B5563" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14 }}>還沒有記錄，點右上角 + 開始記帳</div>
            </div>
          )}

          {sortedDates.map(date => {
            const dayRecords = grouped[date];
            const dayTotal = dayRecords.reduce((s, r) => r.type === "expense" ? s - r.amount : s + r.amount, 0);
            return (
              <div key={date} style={{ marginBottom: 8 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 20px", fontSize: 12, color: "#6B7280",
                }}>
                  <span>{date}</span>
                  <span style={{ color: dayTotal >= 0 ? "#4ADE80" : "#F87171" }}>
                    {dayTotal >= 0 ? "+" : "-"}NT$ {formatMoney(dayTotal)}
                  </span>
                </div>
                {dayRecords.map(r => (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 20px",
                    background: "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${r.catColor}22`,
                      border: `1px solid ${r.catColor}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>{r.catIcon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{r.catLabel}</div>
                      {r.note && <div style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.note}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontSize: 15, fontWeight: 700,
                        color: r.type === "income" ? "#4ADE80" : "#F87171",
                      }}>
                        {r.type === "income" ? "+" : "-"}NT$ {formatMoney(r.amount)}
                      </div>
                    </div>
                    <button onClick={() => deleteRecord(r.id)} style={{
                      background: "none", border: "none", color: "#374151",
                      cursor: "pointer", fontSize: 16, padding: "4px",
                      flexShrink: 0,
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = "#F87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "#374151"}
                    >✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* STATS VIEW */}
      {view === "stats" && (
        <div style={{ flex: 1, padding: 20 }}>
          <div style={{ marginBottom: 20, fontSize: 13, color: "#9CA3AF" }}>各類別支出統計</div>
          {catStats.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#4B5563" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📉</div>
              <div style={{ fontSize: 14 }}>尚無支出記錄</div>
            </div>
          )}
          {catStats.map(cat => (
            <div key={cat.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 13, color: cat.color, fontWeight: 600 }}>NT$ {formatMoney(cat.total)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${(cat.total / maxCat) * 100}%`,
                  background: `linear-gradient(90deg, ${cat.color}88, ${cat.color})`,
                  transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD RECORD MODAL */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end",
        }} onClick={() => setShowForm(false)}>
          <div style={{
            width: "100%", maxWidth: 480, margin: "0 auto",
            background: "#1A1A2E",
            borderRadius: "24px 24px 0 0",
            padding: "24px 20px 32px",
            border: "1px solid rgba(255,255,255,0.08)",
            animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1)",
          }} onClick={e => e.stopPropagation()}>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>新增記錄</span>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Type Toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                  background: type === t.id ? (t.id === "income" ? "#4ADE80" : "#F87171") : "transparent",
                  color: type === t.id ? "#fff" : "#9CA3AF",
                  fontWeight: type === t.id ? 700 : 400, fontSize: 14,
                  transition: "all 0.2s",
                }}>{t.icon} {t.label}</button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6 }}>金額 (NT$)</label>
              <input ref={amountRef} type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" inputMode="numeric"
                style={inputStyle} />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 8 }}>類別</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} style={{
                    padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: category === c.id ? `${c.color}33` : "rgba(255,255,255,0.05)",
                    color: category === c.id ? c.color : "#9CA3AF",
                    fontSize: 13, fontWeight: category === c.id ? 700 : 400,
                    outline: category === c.id ? `1px solid ${c.color}66` : "none",
                    transition: "all 0.15s",
                  }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6 }}>備註（選填）</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="加個說明..." style={inputStyle} />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6 }}>日期</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>

            <button onClick={addRecord} style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              border: "none", borderRadius: 12, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              transition: "opacity 0.2s",
              opacity: amount && !isNaN(Number(amount)) && Number(amount) > 0 ? 1 : 0.5,
            }}>確認新增</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  color: "#E8E8F0", padding: "10px 14px", fontSize: 15,
  outline: "none", boxSizing: "border-box",
};

function pillStyle(active, color) {
  return {
    padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
    background: active ? (color ? `${color}22` : "rgba(129,140,248,0.15)") : "rgba(255,255,255,0.05)",
    color: active ? (color || "#818CF8") : "#6B7280",
    fontSize: 13, fontWeight: active ? 700 : 400,
    outline: active ? `1px solid ${color || "#818CF8"}44` : "none",
    whiteSpace: "nowrap", flexShrink: 0,
    transition: "all 0.15s",
  };
}
