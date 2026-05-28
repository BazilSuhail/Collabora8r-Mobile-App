// Tiny class joiner for the UI kit (same role as the client's utils/cn.js).
export function cn(...parts) {
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) {
      const inner = cn(...p);
      if (inner) out.push(inner);
    } else out.push(String(p));
  }
  return out.join(' ');
}

export default cn;
