// ============================================
// DECADE PLAN — App logic
// ============================================
const STORAGE_KEY = "decade_plan_v1";

let DATA = loadData();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn(e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
  showToast("✓ تم الحفظ");
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

// ===== Path helpers for editable fields =====
function getPath(obj, path) {
  return path.split(".").reduce((a, k) => a?.[k], obj);
}
function setPath(obj, path, val) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = val;
}

// ===== Editable binding =====
function bindEditable() {
  document.querySelectorAll("[contenteditable]").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("blur", () => {
      const path = el.dataset.path;
      if (!path) return;
      const val = el.textContent.trim();
      setPath(DATA, path, val);
      saveData();
    });
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey && el.dataset.single) {
        e.preventDefault(); el.blur();
      }
    });
  });
}

// ===== Progress slider via click on bar =====
function bindProgress(el, path) {
  el.addEventListener("click", e => {
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    setPath(DATA, path, pct);
    saveData();
    route(location.hash.slice(1) || "home");
  });
}

// ===== Navigation =====
const SECTIONS = [
  { id: "home",     icon: "◆", label: "الرئيسية" },
  { id: "vision",   icon: "I", label: "الرؤية الشخصية" },
  { id: "mission",  icon: "II", label: "الرسالة والقيم" },
  { id: "swot",     icon: "III", label: "تحليل الوضع" },
  { id: "areas",    icon: "IV", label: "مجالات الحياة" },
  { id: "goals",    icon: "V", label: "الأهداف الكبرى" },
  { id: "phases",   icon: "VI", label: "المراحل الثلاث" },
  { id: "timeline", icon: "VII", label: "الخط الزمني" },
  { id: "year1",    icon: "VIII", label: "أهداف السنة الأولى" },
  { id: "ventures", icon: "IX", label: "مشاريع ريادة الأعمال" },
  { id: "finance",  icon: "X", label: "الخطة المالية" },
  { id: "habits",   icon: "XI", label: "العادات والروتين" },
  { id: "kpis",     icon: "XII", label: "لوحة المؤشرات" },
  { id: "risks",    icon: "XIII", label: "المخاطر والبدائل" },
  { id: "review",   icon: "XIV", label: "المراجعة والالتزام" }
];

function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = SECTIONS.map(s =>
    `<a href="#${s.id}" data-id="${s.id}"><span class="ic">${s.icon}</span><span>${s.label}</span></a>`
  ).join("");
}

// ===== Router =====
function route(id) {
  const sec = SECTIONS.find(s => s.id === id) || SECTIONS[0];
  document.querySelectorAll("#nav a").forEach(a =>
    a.classList.toggle("active", a.dataset.id === sec.id)
  );
  const view = document.getElementById("view");
  view.innerHTML = renderers[sec.id] ? renderers[sec.id]() : "<p>قيد الإنشاء</p>";
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  bindEditable();
  bindAll();
  document.getElementById("sidebar").classList.remove("open");
}

window.addEventListener("hashchange", () => route(location.hash.slice(1) || "home"));

// ============================================
// RENDERERS
// ============================================
const renderers = {};

// ---------- HOME ----------
renderers.home = () => {
  const d = DATA;
  const avg = Math.round(d.lifeAreas.reduce((s, a) => s + a.score, 0) / d.lifeAreas.length);
  const goalAvg = Math.round(d.goals.reduce((s, g) => s + g.progress, 0) / d.goals.length);
  const phaseAvg = Math.round(d.phases.reduce((s, p) => s + p.progress, 0) / d.phases.length);
  const overall = Math.round((avg + goalAvg + phaseAvg) / 3);

  return `
    <div class="hero">
      <h1>خطة <span>العشر سنوات</span></h1>
      <div class="en">${d.meta.title}</div>
      <div class="vision-ar" style="text-align:right;margin-top:18px;font-size:18px">${d.meta.quote}</div>
      <div class="vision-en" style="text-align:right">${d.meta.quoteSrc}</div>
      <div class="meta">
        <div><span>الاسم · Name</span><strong>${d.meta.name}</strong></div>
        <div><span>تاريخ البدء · Start</span><strong>${d.meta.start}</strong></div>
        <div><span>تاريخ الوصول · Horizon</span><strong>${d.meta.horizon}</strong></div>
      </div>
    </div>

    <div class="grid g4" style="margin-bottom:20px">
      <div class="stat"><div class="v">${overall}%</div><div class="l">الإنجاز الكلي</div></div>
      <div class="stat"><div class="v">${goalAvg}%</div><div class="l">متوسط الأهداف</div></div>
      <div class="stat"><div class="v">${avg}%</div><div class="l">توازن مجالات الحياة</div></div>
      <div class="stat"><div class="v">${phaseAvg}%</div><div class="l">تقدّم المراحل</div></div>
    </div>

    <div class="card">
      <h3>الرؤية في سطر واحد</h3>
      <p style="font-size:16px;line-height:1.9">${d.vision.statement}</p>
    </div>

    <div class="grid g2">
      <div class="card">
        <h3>الأهداف في لمحة</h3>
        ${d.goals.slice(0,5).map(g => `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <span>${g.title}</span><span style="color:var(--gold-2)">${g.progress}%</span>
            </div>
            <div class="bar" style="height:5px;background:var(--line);border-radius:3px;overflow:hidden">
              <i style="display:block;height:100%;width:${g.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="card">
        <h3>المراحل الثلاث</h3>
        ${d.phases.map(p => `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <span><strong style="color:var(--gold-2)">${p.title}</strong> · ${p.period}</span>
              <span>${p.progress}%</span>
            </div>
            <div style="height:5px;background:var(--line);border-radius:3px;overflow:hidden">
              <i style="display:block;height:100%;width:${p.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

// ---------- VISION ----------
renderers.vision = () => `
  <div class="sec-head">
    <div class="sec-num">I · VISION</div>
    <div class="sec-title">الرؤية الشخصية</div>
    <div class="sec-sub">Who I will be in 2036</div>
  </div>

  <div class="vision-quote">
    ${DATA.meta.quote}
    <div class="vision-en" style="font-family:var(--font);font-style:normal">${DATA.meta.quoteSrc}</div>
  </div>

  <div class="card">
    <h3>بيان الرؤية</h3>
    <div class="big-vision" contenteditable data-path="vision.statement">${DATA.vision.statement}</div>
    <p style="color:var(--muted);font-size:13px;margin-top:10px;font-style:italic" contenteditable data-path="vision.statementEn">${DATA.vision.statementEn}</p>
  </div>

  <div class="grid g3">
    ${DATA.vision.pillars.map((p, i) => `
      <div class="pillar">
        <div class="icon">${p.icon}</div>
        <div class="t" contenteditable data-path="vision.pillars.${i}.title">${p.title}</div>
        <div class="d" contenteditable data-path="vision.pillars.${i}.desc">${p.desc}</div>
      </div>
    `).join("")}
  </div>
`;

// ---------- MISSION ----------
renderers.mission = () => `
  <div class="sec-head">
    <div class="sec-num">II · MISSION · PRINCIPLES · VALUES</div>
    <div class="sec-title">الرسالة والمبادئ والقيم</div>
    <div class="sec-sub">What I stand for</div>
  </div>

  <div class="card">
    <h3>الرسالة · Mission</h3>
    <p style="font-size:16px;line-height:1.9" contenteditable data-path="mission.mission">${DATA.mission.mission}</p>
  </div>

  <div class="card">
    <h3>المبادئ · Principles</h3>
    <ul class="clean">
      ${DATA.mission.principles.map((p, i) =>
        `<li contenteditable data-path="mission.principles.${i}">${p}</li>`
      ).join("")}
    </ul>
  </div>

  <div class="grid g3">
    ${DATA.mission.values.map((v, i) => `
      <div class="card">
        <div style="font-family:var(--serif);font-size:28px;color:var(--gold);opacity:.5">${v.n}</div>
        <h3 contenteditable data-path="mission.values.${i}.ar">${v.ar}</h3>
        <div style="font-family:var(--serif);color:var(--muted);font-size:12px;margin-bottom:10px" contenteditable data-path="mission.values.${i}.en">${v.en}</div>
        <p style="font-size:13.5px" contenteditable data-path="mission.values.${i}.desc">${v.desc}</p>
      </div>
    `).join("")}
  </div>
`;

// ---------- SWOT ----------
renderers.swot = () => {
  const blocks = [
    { k: "strengths", L: "S", t: "نقاط القوة", en: "Strengths" },
    { k: "weaknesses", L: "W", t: "نقاط الضعف", en: "Weaknesses" },
    { k: "opportunities", L: "O", t: "الفرص", en: "Opportunities" },
    { k: "threats", L: "T", t: "التهديدات", en: "Threats" }
  ];
  return `
    <div class="sec-head">
      <div class="sec-num">III · PERSONAL SWOT</div>
      <div class="sec-title">تحليل الوضع الحالي</div>
      <div class="sec-sub">Where I stand — October 2026</div>
    </div>
    <div class="grid g2">
      ${blocks.map(b => `
        <div class="swot-card ${b.L}">
          <h3>
            <span class="letter">${b.L}</span>
            <span>${b.t}</span>
            <span style="color:var(--muted);font-size:11px;font-family:var(--serif);font-weight:400;margin-right:auto">${b.en}</span>
          </h3>
          <ul class="clean">
            ${DATA.swot[b.k].map((it, i) =>
              `<li contenteditable data-path="swot.${b.k}.${i}">${it}</li>`
            ).join("")}
          </ul>
        </div>
      `).join("")}
    </div>
  `;
};

// ---------- LIFE AREAS ----------
renderers.areas = () => `
  <div class="sec-head">
    <div class="sec-num">IV · LIFE AREAS</div>
    <div class="sec-title">مجالات الحياة</div>
    <div class="sec-sub">Eight pillars, one balanced life — انقر الدائرة لتعديل النسبة</div>
  </div>
  <div class="grid g2">
    ${DATA.lifeAreas.map((a, i) => `
      <div class="area">
        <div class="ring" style="--v:${a.score}" data-pct="${a.score}" data-path="lifeAreas.${i}.score" title="انقر لضبط النسبة">
          <span>${a.score}%</span>
        </div>
        <div class="meta">
          <div class="t" contenteditable data-path="lifeAreas.${i}.ar">${a.ar}</div>
          <div class="en" contenteditable data-path="lifeAreas.${i}.en">${a.en}</div>
          <div class="d" contenteditable data-path="lifeAreas.${i}.desc">${a.desc}</div>
        </div>
      </div>
    `).join("")}
  </div>
`;

// ---------- GOALS ----------
renderers.goals = () => `
  <div class="sec-head">
    <div class="sec-num">V · TEN-YEAR GOALS</div>
    <div class="sec-title">الأهداف الكبرى</div>
    <div class="sec-sub">The ten that define the decade — انقر الشريط لتعديل النسبة</div>
  </div>
  <div class="grid g2">
    ${DATA.goals.map((g, i) => `
      <div class="goal">
        <div class="num">${String(g.n).padStart(2,"0")}</div>
        <div class="t" contenteditable data-path="goals.${i}.title">${g.title}</div>
        <div class="m" contenteditable data-path="goals.${i}.measure">${g.measure}</div>
        <span class="dl" contenteditable data-path="goals.${i}.deadline">الموعد ${g.deadline}</span>
        <div class="bar" data-pct="${g.progress}" data-path="goals.${i}.progress" title="انقر لضبط النسبة">
          <i style="width:${g.progress}%"></i>
        </div>
        <span class="pct">${g.progress}%</span>
      </div>
    `).join("")}
  </div>
`;

// ---------- PHASES ----------
renderers.phases = () => `
  <div class="sec-head">
    <div class="sec-num">VI · THREE PHASES</div>
    <div class="sec-title">المراحل الثلاث</div>
    <div class="sec-sub">Build · Scale · Legacy</div>
  </div>
  ${DATA.phases.map((p, i) => `
    <div class="phase" style="margin-bottom:16px">
      <div class="tag" contenteditable data-path="phases.${i}.period">${p.period}</div>
      <h3 contenteditable data-path="phases.${i}.title">${p.title}</h3>
      <div class="en" contenteditable data-path="phases.${i}.en">${p.en}</div>
      <div class="desc" contenteditable data-path="phases.${i}.desc">${p.desc}</div>
      <ul class="clean" style="margin-top:10px">
        ${p.criteria.map((c, j) =>
          `<li contenteditable data-path="phases.${i}.criteria.${j}">${c}</li>`
        ).join("")}
      </ul>
      <div style="display:flex;align-items:center;gap:12px;margin-top:14px">
        <div class="bar" style="flex:1;height:8px;background:var(--line);border-radius:4px;overflow:hidden;cursor:pointer"
             data-pct="${p.progress}" data-path="phases.${i}.progress">
          <i style="display:block;height:100%;width:${p.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
        </div>
        <span style="font-family:var(--serif);font-weight:700;color:var(--gold-2);min-width:48px;text-align:left">${p.progress}%</span>
      </div>
    </div>
  `).join("")}
`;

// ---------- TIMELINE ----------
renderers.timeline = () => `
  <div class="sec-head">
    <div class="sec-num">VII · YEAR BY YEAR</div>
    <div class="sec-title">الخط الزمني</div>
    <div class="sec-sub">Ten years, one line</div>
  </div>
  <div class="card">
    <div class="tl">
      ${DATA.timeline.map((t, i) => `
        <div class="tl-item">
          <div class="yr">${t.yr} · ${t.n}</div>
          <div class="ti" contenteditable data-path="timeline.${i}.title">${t.title}</div>
          <ul>
            ${t.ms.map((m, j) =>
              `<li contenteditable data-path="timeline.${i}.ms.${j}">${m}</li>`
            ).join("")}
          </ul>
        </div>
      `).join("")}
    </div>
  </div>
`;

// ---------- YEAR ONE ----------
renderers.year1 = () => `
  <div class="sec-head">
    <div class="sec-num">VIII · YEAR ONE</div>
    <div class="sec-title">أهداف السنة الأولى</div>
    <div class="sec-sub">October 2026 — September 2027</div>
  </div>

  <div class="card" style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <div style="font-size:11px;color:var(--gold);letter-spacing:2px;font-weight:700">كلمة السنة</div>
      <div style="font-size:32px;font-weight:800" contenteditable data-path="yearOne.word">${DATA.yearOne.word}</div>
    </div>
    <div style="flex:1;min-width:200px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span>إنجاز السنة</span><span style="color:var(--gold-2)">${DATA.yearOne.progress}%</span>
      </div>
      <div class="bar" style="height:8px;background:var(--line);border-radius:4px;overflow:hidden;cursor:pointer"
           data-pct="${DATA.yearOne.progress}" data-path="yearOne.progress">
        <i style="display:block;height:100%;width:${DATA.yearOne.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
      </div>
    </div>
  </div>

  <div class="grid g2">
    ${DATA.yearOne.quarters.map((q, i) => `
      <div class="q">
        <div class="qn">${q.q}</div>
        <div class="qt" contenteditable data-path="yearOne.quarters.${i}.period">${q.period}</div>
        <div style="font-weight:700;color:var(--gold-2);font-size:14px;margin-bottom:8px" contenteditable data-path="yearOne.quarters.${i}.title">${q.title}</div>
        <ul>
          ${q.items.map((it, j) =>
            `<li contenteditable data-path="yearOne.quarters.${i}.items.${j}">${it}</li>`
          ).join("")}
        </ul>
      </div>
    `).join("")}
  </div>
`;

// ---------- VENTURES ----------
renderers.ventures = () => `
  <div class="sec-head">
    <div class="sec-num">IX · ENTREPRENEURSHIP</div>
    <div class="sec-title">مشاريع ريادة الأعمال</div>
    <div class="sec-sub">The venture portfolio — مشروع واحد في كل مرة حتى الربحية</div>
  </div>
  <div class="grid g3">
    ${DATA.ventures.map((v, i) => `
      <div class="venture">
        <div class="vnum">${v.n}</div>
        <div class="status" contenteditable data-path="ventures.${i}.status">${v.status}</div>
        <h3 contenteditable data-path="ventures.${i}.title">${v.title}</h3>
        <div style="font-family:var(--serif);color:var(--muted);font-size:12px;margin-bottom:8px" contenteditable data-path="ventures.${i}.en">${v.en}</div>
        <div class="desc" contenteditable data-path="ventures.${i}.desc">${v.desc}</div>
        <div class="meta">
          <div><span>القطاع</span><span contenteditable data-path="ventures.${i}.sector">${v.sector}</span></div>
          <div><span>الإطلاق</span><span contenteditable data-path="ventures.${i}.launch">${v.launch}</span></div>
          <div><span>رأس المال</span><span contenteditable data-path="ventures.${i}.capital">${v.capital}</span></div>
          <div><span>هدف</span><span contenteditable data-path="ventures.${i}.yearGoal">${v.yearGoal}</span></div>
        </div>
        <div class="bar" style="margin-top:14px;height:6px;background:var(--line);border-radius:3px;overflow:hidden;cursor:pointer"
             data-pct="${v.progress}" data-path="ventures.${i}.progress">
          <i style="display:block;height:100%;width:${v.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
        </div>
        <div class="pct" style="font-size:11px;color:var(--gold-2);font-weight:700;margin-top:4px">${v.progress}%</div>
      </div>
    `).join("")}
  </div>
`;

// ---------- FINANCE ----------
renderers.finance = () => `
  <div class="sec-head">
    <div class="sec-num">X · FINANCIAL PLAN</div>
    <div class="sec-title">الخطة المالية</div>
    <div class="sec-sub">Income · Savings · Investment</div>
  </div>
  <div class="card">
    <h3>التوقعات العشرية (انقر الأرقام للتعديل)</h3>
    <table>
      <thead>
        <tr>
          <th>السنة</th><th>الدخل السنوي</th><th>نسبة الادخار</th>
          <th>المستثمر</th><th>صافي الثروة</th>
        </tr>
      </thead>
      <tbody>
        ${DATA.finance.rows.map((r, i) => `
          <tr>
            <td style="font-family:var(--serif);color:var(--gold-2);font-weight:700">${r.y}</td>
            <td contenteditable data-path="finance.rows.${i}.income">${r.income}</td>
            <td contenteditable data-path="finance.rows.${i}.save">${r.save}</td>
            <td contenteditable data-path="finance.rows.${i}.inv">${r.inv}</td>
            <td contenteditable data-path="finance.rows.${i}.net">${r.net}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p style="margin-top:14px;color:var(--muted);font-size:12.5px" contenteditable data-path="finance.note">${DATA.finance.note}</p>
  </div>

  <div class="card">
    <h3>توزيع الدخل الشهري</h3>
    <div class="alloc">
      ${DATA.finance.allocation.map((a, i) => `
        <div class="a">
          <div class="v" contenteditable data-path="finance.allocation.${i}.v">${a.v}</div>
          <div class="l" contenteditable data-path="finance.allocation.${i}.l">${a.l}</div>
        </div>
      `).join("")}
    </div>
  </div>
`;

// ---------- HABITS ----------
renderers.habits = () => {
  const tracker = DATA.habits.tracker || {};
  return `
  <div class="sec-head">
    <div class="sec-num">XI · HABITS & ROUTINE</div>
    <div class="sec-title">العادات والروتين</div>
    <div class="sec-sub">Small days build big decades</div>
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>اليوم المثالي</h3>
      <div class="routine">
        ${DATA.habits.routine.map((r, i) => `
          <div class="r">
            <div class="h" contenteditable data-path="habits.routine.${i}.h">${r.h}</div>
            <div class="t" contenteditable data-path="habits.routine.${i}.t">${r.t}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="card">
      <h3>متتبع العادات الأسبوعي</h3>
      <div class="tracker">
        <table>
          <thead>
            <tr>
              <th>العادة</th>
              ${DATA.habits.days.map(d => `<th>${d}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${DATA.habits.trackerHabits.map((h, i) => `
              <tr>
                <td contenteditable data-path="habits.trackerHabits.${i}">${h}</td>
                ${DATA.habits.days.map((_, j) => {
                  const key = `${i}-${j}`;
                  const on = tracker[key] ? "on" : "";
                  return `<td><span class="chk ${on}" data-key="${key}"></span></td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
};

// ---------- KPIs ----------
renderers.kpis = () => {
  const avg = Math.round(DATA.kpis.table.reduce((s, r) => s + r.progress, 0) / DATA.kpis.table.length);
  return `
  <div class="sec-head">
    <div class="sec-num">XII · KPI DASHBOARD</div>
    <div class="sec-title">لوحة المؤشرات</div>
    <div class="sec-sub">What gets measured gets managed</div>
  </div>

  <div class="kpi-hero">
    <div class="kpi-box main">
      <div class="t">إنجاز الخطة الكلي</div>
      <div class="v" style="font-size:52px">${avg}%</div>
      <div class="l">Overall plan</div>
    </div>
    ${DATA.kpis.top.map((k, i) => `
      <div class="kpi-box">
        <div class="v" contenteditable data-path="kpis.top.${i}.v">${k.v}</div>
        <div class="l" contenteditable data-path="kpis.top.${i}.l">${k.l}</div>
        <div class="sub" contenteditable data-path="kpis.top.${i}.sub">${k.sub}</div>
      </div>
    `).join("")}
  </div>

  <div class="card">
    <h3>تفاصيل المؤشرات (انقر شريط التقدّم للتعديل)</h3>
    <table>
      <thead>
        <tr><th>المؤشر</th><th>المجال</th><th>الحالي</th><th>المستهدف</th><th>التقدّم</th></tr>
      </thead>
      <tbody>
        ${DATA.kpis.table.map((r, i) => `
          <tr>
            <td contenteditable data-path="kpis.table.${i}.kpi">${r.kpi}</td>
            <td contenteditable data-path="kpis.table.${i}.area">${r.area}</td>
            <td contenteditable data-path="kpis.table.${i}.actual">${r.actual}</td>
            <td contenteditable data-path="kpis.table.${i}.target">${r.target}</td>
            <td style="min-width:140px">
              <div class="bar" style="height:6px;background:var(--line);border-radius:3px;overflow:hidden;cursor:pointer"
                   data-pct="${r.progress}" data-path="kpis.table.${i}.progress">
                <i style="display:block;height:100%;width:${r.progress}%;background:linear-gradient(90deg,var(--gold),var(--gold-2))"></i>
              </div>
              <span style="font-size:11px;color:var(--gold-2);font-weight:700">${r.progress}%</span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  `;
};

// ---------- RISKS ----------
renderers.risks = () => {
  const badge = v => v === "high" ? "high" : v === "mid" ? "mid" : "low";
  const lbl = v => v === "high" ? "مرتفع" : v === "mid" ? "متوسط" : "منخفض";
  return `
  <div class="sec-head">
    <div class="sec-num">XIII · RISKS & CONTINGENCY</div>
    <div class="sec-title">المخاطر والخطط البديلة</div>
    <div class="sec-sub">Plan B is part of Plan A</div>
  </div>
  <div class="card">
    <div class="risk head">
      <div class="c">الخطر</div><div class="c">الاحتمال</div><div class="c">الأثر</div>
      <div class="c">الوقاية</div><div class="c">الخطة البديلة</div>
    </div>
    ${DATA.risks.map((r, i) => `
      <div class="risk">
        <div class="c" data-l="الخطر" style="font-weight:700" contenteditable data-path="risks.${i}.risk">${r.risk}</div>
        <div class="c" data-l="الاحتمال"><span class="badge ${badge(r.like)}" data-like="${r.like}" data-i="${i}">${lbl(r.like)}</span></div>
        <div class="c" data-l="الأثر"><span class="badge ${badge(r.impact)}" data-impact="${r.impact}" data-i="${i}">${lbl(r.impact)}</span></div>
        <div class="c" data-l="الوقاية" style="color:var(--muted)" contenteditable data-path="risks.${i}.prevent">${r.prevent}</div>
        <div class="c" data-l="البديل" style="color:var(--gold-2)" contenteditable data-path="risks.${i}.plan">${r.plan}</div>
      </div>
    `).join("")}
  </div>
  `;
};

// ---------- REVIEW ----------
renderers.review = () => `
  <div class="sec-head">
    <div class="sec-num">XIV · REVIEW SYSTEM</div>
    <div class="sec-title">المراجعة والالتزام</div>
    <div class="sec-sub">A plan is only as good as its reviews</div>
  </div>

  <div class="grid g2">
    ${DATA.reviews.map((r, i) => `
      <div class="rev">
        <h3>${r.ar}</h3>
        <div class="freq" contenteditable data-path="reviews.${i}.when">${r.when}</div>
        <ul>
          ${r.items.map((it, j) =>
            `<li contenteditable data-path="reviews.${i}.items.${j}">${it}</li>`
          ).join("")}
        </ul>
      </div>
    `).join("")}
  </div>

  <div class="pledge">
    <div style="font-size:11px;color:var(--gold);letter-spacing:3px;font-weight:700;margin-bottom:14px">عهد الالتزام · PLEDGE</div>
    <p contenteditable data-path="pledge.text">${DATA.pledge.text}</p>
    <div class="sig" contenteditable data-path="pledge.signature">${DATA.pledge.signature}</div>
    <div class="date" contenteditable data-path="pledge.date">التاريخ · ${DATA.pledge.date}</div>
  </div>
`;

// ============================================
// Interactive bindings
// ============================================
function bindAll() {
  // Progress bars
  document.querySelectorAll(".bar[data-path]").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.style.cursor = "pointer";
    el.addEventListener("click", e => {
      const rect = el.getBoundingClientRect();
      let pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      pct = Math.max(0, Math.min(100, pct));
      setPath(DATA, el.dataset.path, pct);
      saveData();
      route(location.hash.slice(1) || "home");
    });
  });

  // Progress rings
  document.querySelectorAll(".ring[data-path]").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.style.cursor = "pointer";
    el.title = "انقر لضبط النسبة يدويًا";
    el.addEventListener("click", () => {
      const cur = getPath(DATA, el.dataset.path);
      const v = prompt("النسبة الحالية (0-100):", cur);
      if (v === null) return;
      const n = Math.max(0, Math.min(100, parseInt(v) || 0));
      setPath(DATA, el.dataset.path, n);
      saveData();
      route(location.hash.slice(1) || "home");
    });
  });

  // Habit checkboxes
  document.querySelectorAll(".chk").forEach(el => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", () => {
      const key = el.dataset.key;
      DATA.habits.tracker = DATA.habits.tracker || {};
      if (DATA.habits.tracker[key]) delete DATA.habits.tracker[key];
      else DATA.habits.tracker[key] = true;
      el.classList.toggle("on");
      saveData();
    });
  });

  // Risk badges toggling
  document.querySelectorAll(".badge[data-like]").forEach(b => {
    if (b.dataset.bound) return;
    b.dataset.bound = "1";
    b.style.cursor = "pointer";
    b.addEventListener("click", () => {
      const i = +b.dataset.i;
      const seq = ["low", "mid", "high"];
      const next = seq[(seq.indexOf(DATA.risks[i].like) + 1) % 3];
      DATA.risks[i].like = next;
      saveData();
      route(location.hash.slice(1) || "home");
    });
  });
  document.querySelectorAll(".badge[data-impact]").forEach(b => {
    if (b.dataset.bound) return;
    b.dataset.bound = "1";
    b.style.cursor = "pointer";
    b.addEventListener("click", () => {
      const i = +b.dataset.i;
      const seq = ["low", "mid", "high"];
      const next = seq[(seq.indexOf(DATA.risks[i].impact) + 1) % 3];
      DATA.risks[i].impact = next;
      saveData();
      route(location.hash.slice(1) || "home");
    });
  });
}

// ============================================
// Export / Import / Reset / Print
// ============================================
function exportJSON() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `decade-plan-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✓ تم التصدير");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      DATA = JSON.parse(e.target.result);
      saveData();
      route(location.hash.slice(1) || "home");
      showToast("✓ تم الاستيراد");
    } catch {
      showToast("✗ ملف غير صالح");
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm("سيتم حذف كل التعديلات والعودة للبيانات الافتراضية. متابعة؟")) return;
  localStorage.removeItem(STORAGE_KEY);
  DATA = JSON.parse(JSON.stringify(DEFAULT_DATA));
  route(location.hash.slice(1) || "home");
  showToast("↺ تمت إعادة التعيين");
}

// ============================================
// Init
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  buildNav();

  document.getElementById("menuBtn").addEventListener("click", () =>
    document.getElementById("sidebar").classList.toggle("open"));

  document.getElementById("exportBtn").addEventListener("click", exportJSON);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("importInput").addEventListener("change", e => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  });

  route(location.hash.slice(1) || "home");
});