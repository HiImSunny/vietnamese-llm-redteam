import "./index.css";

// Interfaces for LLM Evaluation Results
interface TestResult {
  prompt_id: string;
  prompt_text: string;
  category: string;
  model_display: string;
  attack_type: string;
  verdict: "JAILBROKEN" | "REFUSED" | "ERROR";
  response: string | null;
}

interface StatsSummary {
  total: number;
  jailbroken: number;
  refused: number;
  errors: number;
  models: string[];
  jailbroken_pct: number;
}

// Global UI and Filter State
let allResults: TestResult[] = [];
let activeModelFilter = "ALL";
let activeVerdictFilter = "ALL";
let searchQuery = "";
let currentLang: "VI" | "EN" = "VI";

// Mapping categories to localization maps
const categoryLocalMap: Record<"VI" | "EN", Record<string, string>> = {
  VI: {
    violent_crimes: "Tội phạm / Bạo lực",
    scam_phishing: "Lừa đảo / Giả mạo",
    political_misinfo: "Sai lệch chính trị",
    unsafe_medical: "Lời khuyên y tế độc hại",
    hate_speech: "Ngôn từ thù hận",
    self_harm: "Tự hại / Tự hủy"
  },
  EN: {
    violent_crimes: "Violent Crimes / Malfeasance",
    scam_phishing: "Scams & Phishing",
    political_misinfo: "Political Misinformation",
    unsafe_medical: "Unsafe Medical Advice",
    hate_speech: "Hate Speech & Bigotry",
    self_harm: "Self-Harm / Suicide"
  }
};

// Mapping attack types to localization maps
const attackLocalMap: Record<"VI" | "EN", Record<string, string>> = {
  VI: {
    direct: "Tấn công trực tiếp (Direct)",
    crosslingual: "Đa ngôn ngữ (Crosslingual)",
    multiturn: "Nhiều lượt hội thoại (Multiturn)",
    roleplay: "Nhập vai bẻ khóa (Roleplay)"
  },
  EN: {
    direct: "Direct Bypass (Zero-shot)",
    crosslingual: "Crosslingual Pivot",
    multiturn: "Multi-turn Adversarial",
    roleplay: "Adversarial Persona Roleplay"
  }
};

// Complete Translation Dictionary representing entire UI elements
const translations = {
  VI: {
    brand_sub: "Hệ thống đánh giá Jailbreak an toàn mô hình ngôn ngữ tiếng Việt",
    status_checking: "Kiểm thử kết nối...",
    status_offline: "Trạng thái ngoại tuyến",
    status_active: "Python Server (Hoạt động: Port 8080)",
    status_simulated: "Trực quan Sandbox giả lập",
    reload: "Tải lại",
    stat_total_title: "TỔNG SỐ THỬ NGHIỆM",
    stat_total_unit: "LƯỢT CHẠY",
    stat_total_desc: "Hồi đáp ngữ nghĩa từ bộ dữ liệu chuẩn",
    stat_jailbroken_title: "BỊ BỂ KHÓA (JAILBROKEN)",
    stat_refused_title: "NGĂN CHẶN AN TOÀN (REFUSED)",
    stat_errors_title: "SỰ CỐ ĐÁNH GIÁ (ERRORS)",
    chart_model_title: "Tỷ Lệ Bị Bẻ Khóa Theo Mô Hình Ngôn Ngữ",
    chart_model_desc: "Tỷ lệ phần trăm bẻ khóa thành công trên tổng số lượt thử nghiệm an an sinh của mô hình",
    chart_attack_title: "Độ Hiệu Quả Theo Phương Thức Tấn Công (Attack Vectors)",
    chart_attack_desc: "Sự chênh lệch tỉ lệ bẻ khóa thành công dựa trên cấu trúc prompt và hình thức tác động",
    list_title: "Danh Sách Thực Nghiệm Chi Tiết",
    list_desc: "Rà soát chi tiết, lọc và truy vấn từng lượt thử nghiệm bảo mật ngữ nghĩa tiếng Việt",
    search_placeholder: "Tìm tự khóa trong prompt...",
    filter_model: "Lọc Mô Hình:",
    filter_verdict: "Kết Luận:",
    th_id: "Mã Đề",
    th_prompt: "Nội Dung Thử Nghiệm (Prompt)",
    th_model: "Mô Hình",
    th_attack: "Phương Thức",
    th_category: "Danh Mục",
    th_verdict: "Đánh Giá",
    th_action: "Tác Vụ",
    btn_details: "Chi tiết",
    no_results: "Không tìm thấy thực nghiệm nào khớp với bộ lọc hiện tại.",
    btn_close: "Đóng bảng",
    loading_data: "Đang đồng bộ hóa dữ liệu kiểm thử an toàn...",
    alert_banner_title: "Ghi Chú Vận Hành Red-Teaming:",
    alert_banner_desc: "Tập dữ liệu chứa câu từ nhạy cảm tiếng Việt nhằm kiểm định tường mật rào bảo vệ của các mô hình LLM. Hãy ngăn chặn phát tán phản hồi sinh ra phục vụ mục đích sai lệch.",
    footer_copy: "© 2026 VIET-JBB | AI Red Teaming & Semantics Evaluation Dashboard.",
    footer_desc: "Nền tảng kiểm thử phục vụ tối ưu và định lượng rào an toàn cho cộng đồng phát triển trí tuệ nhân tạo Việt ngữ.",
    modal_title: "Chi Tiết Lịch Sử Red-Teaming",
    modal_meta_model: "MÔ HÌNH",
    modal_meta_attack: "PHƯƠNG PHÁP",
    modal_meta_category: "CHỦ ĐỀ CHÍNH",
    modal_meta_verdict: "ĐÁNH GIÁ",
    modal_prompt_label: "PROMPT ĐẦU VÀO (PROMPT TEXT):",
    modal_response_label: "PHẢN HỒI THỰC TẾ GHI NHẬN:",
    modal_response_empty: "[Không có phản hồi từ mô hình]",
    modal_response_error: "[Lỗi luồng xử lý phản hồi từ server máy chủ. Hoàn thành ghi nhận lỗi kết nối.]",
    action_success_tag_jailbroken: "⚠️ Tấn công thành công (Jailbreak)",
    action_success_tag_refused: "🛡️ Đã ngăn chặn an toàn (Refused)",
    action_success_tag_error: "🛑 Lỗi phản hồi (System Error)"
  },
  EN: {
    brand_sub: "Vulnerability & safety evaluation framework for Vietnamese LLMs",
    status_checking: "Checking connection...",
    status_offline: "Offline Mode Status",
    status_active: "Python Server (Active: Port 8080)",
    status_simulated: "Visualized Sandbox Environment",
    reload: "Reload",
    stat_total_title: "TOTAL EXPERIMENTS",
    stat_total_unit: "RUNS",
    stat_total_desc: "Semantic responses compiled from standard test suites",
    stat_jailbroken_title: "SUCCESSFUL JAILBREAKS",
    stat_refused_title: "SAFE PROTECTIONS (REFUSED)",
    stat_errors_title: "EVALUATION ERRORS",
    chart_model_title: "Jailbreak Success Rate by Language Model",
    chart_model_desc: "Percentage of successful bypasses over the model's total security attempts",
    chart_attack_title: "Attack Efficacy by Vector",
    chart_attack_desc: "Comparison of successful jailbreaks based on structural prompt design and adversarial approaches",
    list_title: "Detailed Red-Teaming Records",
    list_desc: "Audit, search, and granularly review individual high-order security evaluations",
    search_placeholder: "Search keywords in prompt...",
    filter_model: "Model:",
    filter_verdict: "Verdict:",
    th_id: "ID",
    th_prompt: "Adversarial Prompt",
    th_model: "Model",
    th_attack: "Vector",
    th_category: "Category",
    th_verdict: "Verdict",
    th_action: "Actions",
    btn_details: "Details",
    no_results: "No experiments matched the selected filter parameters.",
    btn_close: "Close Panel",
    loading_data: "Synchronizing security testing datastream...",
    alert_banner_title: "Red-Teaming Operational Notice:",
    alert_banner_desc: "The dataset contains sensitive adversarial Vietnamese text designed to assess protective barriers. Avoid redistributing raw LLM generations for harmful purposes.",
    footer_copy: "© 2026 VIET-JBB | AI Red Teaming & Semantics Evaluation Dashboard.",
    footer_desc: "A benchmarking platform for optimizing and quantifying security guardrails within the Vietnamese AI ecosystem.",
    modal_title: "Red-Teaming History Details",
    modal_meta_model: "MODEL",
    modal_meta_attack: "VECTOR",
    modal_meta_category: "CORE TOPIC",
    modal_meta_verdict: "VERDICT",
    modal_prompt_label: "INPUT ADVERSARIAL PROMPT:",
    modal_response_label: "RECORDED MODEL GENERATION:",
    modal_response_empty: "[No response captured from model]",
    modal_response_error: "[System failure processing model generation flow. Error saved.]",
    action_success_tag_jailbroken: "⚠️ Adversarial Success (Jailbroken)",
    action_success_tag_refused: "🛡️ Safe Prevention (Refused)",
    action_success_tag_error: "🛑 Execution Error (System Error)"
  }
};

// Start application logic when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

// Primary controller to bootstrap API loads & attach interactions
async function initDashboard() {
  try {
    setupEventListeners();
    translateStaticTexts();
    await checkBackendConnection();
    await loadData();
  } catch (err) {
    console.error("Lỗi khởi tạo dashboard:", err);
  }
}

// Translate all elements with specific layout IDS
function translateStaticTexts() {
  const dict = translations[currentLang];
  
  const idsToTranslate: Record<string, string> = {
    "header-brand-sub": dict.brand_sub,
    "header-btn-reload-txt": dict.reload,
    "stat-box-1-lbl": dict.stat_total_title,
    "stat-box-1-unit": dict.stat_total_unit,
    "stat-box-1-desc": dict.stat_total_desc,
    "stat-box-2-lbl": dict.stat_jailbroken_title,
    "stat-box-3-lbl": dict.stat_refused_title,
    "stat-box-4-lbl": dict.stat_errors_title,
    "chart-model-panel-title": dict.chart_model_title,
    "chart-model-panel-desc": dict.chart_model_desc,
    "chart-attack-panel-title": dict.chart_attack_title,
    "chart-attack-panel-desc": dict.chart_attack_desc,
    "list-panel-title": dict.list_title,
    "list-panel-desc": dict.list_desc,
    "filter-model-lbl": dict.filter_model,
    "filter-verdict-lbl": dict.filter_verdict,
    "th-lbl-id": dict.th_id,
    "th-lbl-prompt": dict.th_prompt,
    "th-lbl-model": dict.th_model,
    "th-lbl-attack": dict.th_attack,
    "th-lbl-category": dict.th_category,
    "th-lbl-verdict": dict.th_verdict,
    "th-lbl-action": dict.th_action,
    "alert-banner-bold": dict.alert_banner_title,
    "live-banner-alert-desc": dict.alert_banner_desc,
    "footer-text-copy": dict.footer_copy,
    "footer-text-desc": dict.footer_desc,
    "modal-title-header": dict.modal_title,
    "modal-lbl-model": dict.modal_meta_model,
    "modal-lbl-attack": dict.modal_meta_attack,
    "modal-lbl-category": dict.modal_meta_category,
    "modal-lbl-verdict": dict.modal_meta_verdict,
    "modal-lbl-prompt": dict.modal_prompt_label,
    "modal-lbl-response": dict.modal_response_label,
    "modal-action-btn-close-lbl": dict.btn_close
  };

  for (const [id, value] of Object.entries(idsToTranslate)) {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = value;
    }
  }

  // Translate search placeholder
  const searchFilter = document.getElementById("search-filter") as HTMLInputElement;
  if (searchFilter) {
    searchFilter.placeholder = dict.search_placeholder;
  }

  // Translate stationary labels
  const verdictAllBtn = document.querySelector('[data-verdict="ALL"]') as HTMLButtonElement;
  if (verdictAllBtn) {
    verdictAllBtn.innerText = currentLang === "VI" ? "Tất cả" : "All";
  }
}

// Switch current language context dynamically
function setLanguage(lang: "VI" | "EN") {
  currentLang = lang;
  
  const viBtn = document.getElementById("lang-vi-btn");
  const enBtn = document.getElementById("lang-en-btn");
  
  if (viBtn && enBtn) {
    if (lang === "VI") {
      viBtn.className = "px-2.5 py-1 text-[10px] font-bold rounded-md transition select-none bg-indigo-600/90 text-white cursor-pointer hover:bg-indigo-600";
      enBtn.className = "px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-md transition select-none cursor-pointer hover:bg-white/[0.04]";
    } else {
      enBtn.className = "px-2.5 py-1 text-[10px] font-bold rounded-md transition select-none bg-indigo-600/90 text-white cursor-pointer hover:bg-indigo-600";
      viBtn.className = "px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white rounded-md transition select-none cursor-pointer hover:bg-white/[0.04]";
    }
  }

  translateStaticTexts();
  checkBackendConnection(); // Translate the dynamic connection label
  renderCharts(allResults);
  renderFilterButtons(allResults);
  applyFiltersAndRender();
}

// Check backend status code (checks if Python flask server is reachable or fake fallback)
async function checkBackendConnection() {
  const indicator = document.getElementById("backend-indicator");
  const text = document.getElementById("backend-text");
  const badge = document.getElementById("backend-badge");
  const liveBanner = document.getElementById("live-banner-alert");

  if (!indicator || !text) return;

  const dict = translations[currentLang];

  try {
    const res = await fetch("/api/backend-status");
    if (res.ok) {
      const data = await res.json();
      if (data.connected) {
        // Connected directly to active Flask/FastAPI Backend
        indicator.className = "h-2 w-2 rounded-full status-dot-green";
        text.innerText = dict.status_active;
        if (badge) {
          badge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 backdrop-blur-xl text-[11px] text-emerald-300 transition duration-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
        }
        liveBanner?.classList.add("flex");
        liveBanner?.classList.remove("hidden");
      } else {
        // Graceful fallback to rich simulated environment
        indicator.className = "h-2 w-2 rounded-full status-dot-amber";
        text.innerText = dict.status_simulated;
        if (badge) {
          badge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/20 border border-amber-500/20 backdrop-blur-xl text-[11px] text-amber-300 transition duration-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
        }
        liveBanner?.classList.add("flex");
        liveBanner?.classList.remove("hidden");
      }
    }
  } catch (err) {
    indicator.className = "h-2 w-2 rounded-full status-dot-red";
    text.innerText = dict.status_offline;
    if (badge) {
      badge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-500/20 backdrop-blur-xl text-[11px] text-red-300 transition duration-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]";
    }
  }
}

// Load dynamic data from Node routing proxy
async function loadData() {
  try {
    // Show loading indicators
    showLoadingState();

    const [resultsRes, statsRes] = await Promise.all([
      fetch("/api/results"),
      fetch("/api/stats")
    ]);

    if (!resultsRes.ok || !statsRes.ok) {
      throw new Error("Lỗi tải thông tin API endpoints.");
    }

    allResults = await resultsRes.json();
    const stats: StatsSummary = await statsRes.json();

    // Populate overview widgets
    renderStats(stats);

    // Compute and draw interactive charts
    renderCharts(allResults);

    // Populate filter buttons dynamically based on unique models
    renderFilterButtons(allResults);

    // Render detailed dataset table
    applyFiltersAndRender();

  } catch (error) {
    console.error("Lập hồ sơ dữ liệu thất bại:", error);
    renderTableError();
  }
}

// Register browser interaction triggers
function setupEventListeners() {
  const btnReload = document.getElementById("btn-reload");
  const searchFilter = document.getElementById("search-filter") as HTMLInputElement;

  if (btnReload) {
    btnReload.addEventListener("click", async () => {
      // Small scale spin transition indication
      btnReload.classList.add("animate-spin");
      await checkBackendConnection();
      await loadData();
      setTimeout(() => btnReload.classList.remove("animate-spin"), 600);
    });
  }

  // Register language switcher triggers
  const viLangBtn = document.getElementById("lang-vi-btn");
  const enLangBtn = document.getElementById("lang-en-btn");
  if (viLangBtn && enLangBtn) {
    viLangBtn.addEventListener("click", () => setLanguage("VI"));
    enLangBtn.addEventListener("click", () => setLanguage("EN"));
  }

  if (searchFilter) {
    searchFilter.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      applyFiltersAndRender();
    });
  }

  // Register Verdict badge filter events
  const verdictButtons = document.querySelectorAll("#filter-verdict-buttons button");
  verdictButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Clear styles for all buttons
      verdictButtons.forEach(b => {
        const v = b.getAttribute("data-verdict");
        if (v === "ALL") {
          b.className = "filter-badge px-3.5 py-1.5 bg-white/[0.02] text-slate-300 text-[11px] font-semibold rounded-lg border border-white/[0.08] hover:bg-white/[0.08] cursor-pointer select-none transition duration-300";
        } else if (v === "JAILBROKEN") {
          b.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-400 transition cursor-pointer select-none flex items-center gap-1.5 duration-300";
        } else if (v === "REFUSED") {
          b.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-400 transition cursor-pointer select-none flex items-center gap-1.5 duration-300";
        } else if (v === "ERROR") {
          b.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-400 transition cursor-pointer select-none flex items-center gap-1.5 duration-300";
        }
      });

      const verdict = btn.getAttribute("data-verdict") || "ALL";
      activeVerdictFilter = verdict;

      // Assign highlighted clean active design (using extremely glassy vibrant contrasts)
      if (verdict === "ALL") {
        btn.className = "filter-badge px-3.5 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition-all duration-300 cursor-pointer select-none shadow-[0_0_15px_rgba(99,102,241,0.35)]";
      } else if (verdict === "JAILBROKEN") {
        btn.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.35)]";
      } else if (verdict === "REFUSED") {
        btn.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.35)]";
      } else if (verdict === "ERROR") {
        btn.className = "filter-badge px-3.5 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.35)]";
      }

      applyFiltersAndRender();
    });
  });

  // Modal actions
  const modalClose = document.getElementById("modal-close-btn");
  const modalActionClose = document.getElementById("modal-action-close");
  const modalOuter = document.getElementById("detail-modal");

  const closeModal = () => {
    const modal = document.getElementById("detail-modal");
    const card = document.getElementById("detail-modal-card");
    if (modal && card) {
      card.classList.add("scale-95");
      setTimeout(() => {
        modal.classList.add("hidden");
      }, 150);
    }
  };

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalActionClose) modalActionClose.addEventListener("click", closeModal);
  if (modalOuter) {
    modalOuter.addEventListener("click", (e) => {
      if (e.target === modalOuter) closeModal();
    });
  }
}

// Show animated skeletons when re-fetching
function showLoadingState() {
  const tableBody = document.getElementById("results-table-body");
  const mobileContainer = document.getElementById("results-mobile-container");
  const dict = translations[currentLang];

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-20 text-sm text-gray-500">
          <div class="flex justify-center items-center gap-3">
            <svg class="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="text-slate-300 font-medium">${dict.loading_data}</span>
          </div>
        </td>
      </tr>
    `;
  }

  if (mobileContainer) {
    mobileContainer.innerHTML = `
      <div class="text-center py-12 text-sm text-slate-400">
         ${dict.loading_data}
      </div>
    `;
  }
}

// Display error alert in table layout when API crashes
function renderTableError() {
  const tableBody = document.getElementById("results-table-body");
  const mobileContainer = document.getElementById("results-mobile-container");

  const errMsgVi = `
    <tr>
      <td colspan="7" class="text-center py-14 text-sm text-red-400">
        <svg class="w-10 h-10 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <span class="font-bold text-gray-200">Không thể kết nối đến máy chủ lấy dữ liệu.</span><br/>Vui lòng đảm bảo backend Python hoạt động và bấm tải lại.
      </td>
    </tr>
  `;

  const errMsgEn = `
    <tr>
      <td colspan="7" class="text-center py-14 text-sm text-red-400">
        <svg class="w-10 h-10 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <span class="font-bold text-gray-200">Unable to link with backend datastream.</span><br/>Ensure Python server or simulated endpoints are operational & click Reload.
      </td>
    </tr>
  `;

  const errMsg = currentLang === "VI" ? errMsgVi : errMsgEn;

  if (tableBody) tableBody.innerHTML = errMsg;
  if (mobileContainer) {
    mobileContainer.innerHTML = `
      <div class="text-center py-10 px-4 text-sm text-red-400">
         ${currentLang === "VI" ? "Không thể khởi động kết nối API backend. Vui lòng bấm làm mới." : "Could not connect to backend server. Please trigger a manual refresh."}
      </div>
    `;
  }
}

// Render Header counts and grid hero metrics cards
function renderStats(stats: StatsSummary) {
  const totalEl = document.getElementById("stat-total");
  const jailEl = document.getElementById("stat-jailbroken");
  const jailPctEl = document.getElementById("stat-jailbroken-pct");
  const refuseEl = document.getElementById("stat-refused");
  const refusePctEl = document.getElementById("stat-refused-pct");
  const errorEl = document.getElementById("stat-errors");
  const errorPctEl = document.getElementById("stat-errors-pct");

  const progJail = document.getElementById("progress-jailbroken");
  const progRefuse = document.getElementById("progress-refused");
  const progError = document.getElementById("progress-errors");

  if (totalEl) totalEl.innerText = stats.total.toString();
  
  if (jailEl && jailPctEl) {
    jailEl.innerText = stats.jailbroken.toString();
    const pct = stats.total > 0 ? Math.round((stats.jailbroken / stats.total) * 100) : 0;
    jailPctEl.innerText = `${pct}%`;
    if (progJail) progJail.style.width = `${pct}%`;
  }

  if (refuseEl && refusePctEl) {
    refuseEl.innerText = stats.refused.toString();
    const pct = stats.total > 0 ? Math.round((stats.refused / stats.total) * 100) : 0;
    refusePctEl.innerText = `${pct}%`;
    if (progRefuse) progRefuse.style.width = `${pct}%`;
  }

  if (errorEl && errorPctEl) {
    errorEl.innerText = stats.errors.toString();
    const pct = stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0;
    errorPctEl.innerText = `${pct}%`;
    if (progError) progError.style.width = `${pct}%`;
  }
}

// Compute ratings and plot gorgeous custom vertical progress charts
function renderCharts(results: TestResult[]) {
  const modelCont = document.getElementById("chart-models-container");
  const attackCont = document.getElementById("chart-attacks-container");

  if (!modelCont || !attackCont) return;

  const runsText = currentLang === "VI" ? "lần chạy" : "runs";
  const caseText = currentLang === "VI" ? "vụ" : "cases";

  // 1. Group by MODEL
  const modelMap: Record<string, { total: number; jailbroken: number }> = {};
  results.forEach(item => {
    if (!modelMap[item.model_display]) {
      modelMap[item.model_display] = { total: 0, jailbroken: 0 };
    }
    modelMap[item.model_display].total += 1;
    if (item.verdict === "JAILBROKEN") {
      modelMap[item.model_display].jailbroken += 1;
    }
  });

  const modelStats = Object.keys(modelMap).map(model => {
    const data = modelMap[model];
    const pct = data.total > 0 ? Math.round((data.jailbroken / data.total) * 100) : 0;
    return { model, total: data.total, jailbroken: data.jailbroken, pct };
  }).sort((a, b) => b.pct - a.pct);

  // Build model chart list
  modelCont.innerHTML = "";
  if (modelStats.length === 0) {
    modelCont.innerHTML = `<p class="text-xs text-slate-500 py-6 text-center">${currentLang === "VI" ? "Không có dữ liệu thống kê mô hình" : "No model telemetry cached"}</p>`;
  } else {
    modelStats.forEach(obj => {
      // Determine bar solid colors based on risk factors
      let colorClass = "bg-gradient-to-r from-emerald-500/80 to-teal-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
      let textBadgeClass = "text-emerald-450 bg-emerald-500/10 border-emerald-500/15";
      if (obj.pct > 35) {
        colorClass = "bg-gradient-to-r from-red-500/80 to-rose-450/80 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
        textBadgeClass = "text-red-400 bg-red-500/10 border-red-500/15";
      } else if (obj.pct > 15) {
        colorClass = "bg-gradient-to-r from-amber-500/80 to-orange-400/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
        textBadgeClass = "text-amber-400 bg-amber-500/10 border-amber-500/15";
      }

      const rowHtml = `
        <div class="space-y-1.5 group">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div class="flex items-center gap-2">
              <span class="font-bold text-white group-hover:text-indigo-400 transition">${obj.model}</span>
              <span class="text-[10px] text-slate-500">(${obj.total} ${runsText})</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-mono text-[11px]">${obj.jailbroken}/${obj.total} ${caseText}</span>
              <span class="px-2 py-0.5 rounded border text-[10px] ${textBadgeClass} font-mono font-semibold">${obj.pct}% Jailbreak</span>
            </div>
          </div>
          <!-- Fine elegant sleek glass trace -->
          <div class="w-full h-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full overflow-hidden relative">
            <div class="h-full rounded-full glass-bar ${colorClass} transition-all duration-700 relative" style="width: ${obj.pct}%"></div>
          </div>
        </div>
      `;
      modelCont.innerHTML += rowHtml;
    });
  }

  // 2. Group by ATTACK TYPE
  const attackMap: Record<string, { total: number; jailbroken: number }> = {};
  results.forEach(item => {
    if (!attackMap[item.attack_type]) {
      attackMap[item.attack_type] = { total: 0, jailbroken: 0 };
    }
    attackMap[item.attack_type].total += 1;
    if (item.verdict === "JAILBROKEN") {
      attackMap[item.attack_type].jailbroken += 1;
    }
  });

  const attackStats = Object.keys(attackMap).map(type => {
    const data = attackMap[type];
    const pct = data.total > 0 ? Math.round((data.jailbroken / data.total) * 100) : 0;
    return { type, total: data.total, jailbroken: data.jailbroken, pct };
  }).sort((a, b) => b.pct - a.pct);

  // Build attack chart list
  attackCont.innerHTML = "";
  if (attackStats.length === 0) {
    attackCont.innerHTML = `<p class="text-xs text-slate-500 py-6 text-center">${currentLang === "VI" ? "Không có dữ liệu thống kê phương thức" : "No vector telemetry cached"}</p>`;
  } else {
    attackStats.forEach(obj => {
      let colorClass = "bg-gradient-to-r from-indigo-500/80 to-violet-400/80 shadow-[0_0_12px_rgba(99,102,241,0.3)]";
      let borderClass = "border-sky-500/15 bg-sky-500/10 text-sky-400";
      if (obj.pct > 40) {
        colorClass = "bg-gradient-to-r from-rose-500/80 to-pink-400/80 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
        borderClass = "border-red-500/15 bg-red-500/10 text-red-400";
      }

      const vietnameseLabel = attackLocalMap[currentLang][obj.type] || obj.type;

      const rowHtml = `
        <div class="space-y-1.5 group">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div class="flex items-center gap-1.5 max-w-[70%]">
              <span class="font-bold text-white group-hover:text-indigo-400 transition truncate">${vietnameseLabel}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-slate-500 text-[10px] font-mono">${obj.total} tests</span>
              <span class="px-2 py-0.5 rounded border text-[10px] ${borderClass} font-mono font-semibold">${obj.pct}%</span>
            </div>
          </div>
          <!-- Fine elegant sleek glass trace -->
          <div class="w-full h-1.5 bg-white/[0.02] border border-white/[0.05] rounded-full overflow-hidden relative">
            <div class="h-full rounded-full glass-bar ${colorClass} transition-all duration-700 relative" style="width: ${obj.pct}%"></div>
          </div>
        </div>
      `;
      attackCont.innerHTML += rowHtml;
    });
  }
}

// Generate Model Filter buttons dynamically based on models present in raw evaluation lists
function renderFilterButtons(results: TestResult[]) {
  const modelFilterBtnCont = document.getElementById("filter-model-buttons");
  if (!modelFilterBtnCont) return;

  const models = Array.from(new Set(results.map(r => r.model_display)));

  modelFilterBtnCont.innerHTML = "";
  
  // Default "All" button
  const allBtn = document.createElement("button");
  allBtn.setAttribute("data-model", "ALL");
  
  if (activeModelFilter === "ALL") {
    allBtn.className = "filter-badge-model px-3.5 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition duration-300 cursor-pointer select-none shadow-[0_0_15px_rgba(99,102,241,0.35)]";
  } else {
    allBtn.className = "filter-badge-model px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] text-[11px] font-semibold rounded-lg transition duration-300 cursor-pointer select-none";
  }
  
  allBtn.innerText = currentLang === "VI" ? "Tất cả" : "All";
  allBtn.addEventListener("click", () => selectModelFilter("ALL", allBtn));
  modelFilterBtnCont.appendChild(allBtn);

  // Individual model buttons
  models.forEach(modelName => {
    const btn = document.createElement("button");
    btn.setAttribute("data-model", modelName);
    
    if (activeModelFilter === modelName) {
      btn.className = "filter-badge-model px-3.5 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition duration-300 cursor-pointer select-none shadow-[0_0_15px_rgba(99,102,241,0.35)]";
    } else {
      btn.className = "filter-badge-model px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] text-[11px] font-semibold rounded-lg transition duration-300 cursor-pointer select-none";
    }
    
    btn.innerText = modelName;
    btn.addEventListener("click", () => selectModelFilter(modelName, btn));
    modelFilterBtnCont.appendChild(btn);
  });
}

// Model filter selector coordination
function selectModelFilter(model: string, selectedBtn: HTMLButtonElement) {
  activeModelFilter = model;
  
  const modelButtons = document.querySelectorAll(".filter-badge-model");
  modelButtons.forEach(btn => {
    btn.className = "filter-badge-model px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] text-[11px] font-semibold rounded-lg transition duration-300 cursor-pointer select-none";
  });

  // Assign bright active highlight
  selectedBtn.className = "filter-badge-model px-3.5 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition duration-300 cursor-pointer select-none shadow-[0_0_15px_rgba(99,102,241,0.35)]";

  applyFiltersAndRender();
}

// Process logical filters in memory and write out dataset views
function applyFiltersAndRender() {
  const tableBody = document.getElementById("results-table-body");
  const mobileContainer = document.getElementById("results-mobile-container");
  const logCountLoaded = document.getElementById("log-count-loaded");
  const logCountTotal = document.getElementById("log-count-total");
  const activeFiltersInfo = document.getElementById("active-filters-info");
  const dict = translations[currentLang];

  if (!tableBody || !mobileContainer) return;

  // Filter processes
  const filtered = allResults.filter(item => {
    const matchModel = activeModelFilter === "ALL" || item.model_display === activeModelFilter;
    const matchVerdict = activeVerdictFilter === "ALL" || item.verdict === activeVerdictFilter;
    
    const matchSearch = searchQuery.trim() === "" || 
      item.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.response && item.response.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchModel && matchVerdict && matchSearch;
  });

  // Write matching counts
  if (logCountLoaded) logCountLoaded.innerText = filtered.length.toString();
  if (logCountTotal) logCountTotal.innerText = allResults.length.toString();

  // Indicate active filters
  if (activeFiltersInfo) {
    if (activeModelFilter !== "ALL" || activeVerdictFilter !== "ALL" || searchQuery.trim() !== "") {
      activeFiltersInfo.classList.remove("hidden");
    } else {
      activeFiltersInfo.classList.add("hidden");
    }
  }

  // Draw Desktop elements
  tableBody.innerHTML = "";
  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-16 text-xs text-slate-400">
          ${dict.no_results}
        </td>
      </tr>
    `;
  } else {
    filtered.forEach(row => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-white/[0.02] transition border-b border-white/[0.04]";
      
      // Determine judgment badge colors
      let verdictBadgeClass = "";
      if (row.verdict === "JAILBROKEN") {
        verdictBadgeClass = "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]";
      } else if (row.verdict === "REFUSED") {
        verdictBadgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      } else {
        verdictBadgeClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      }

      // Format category and attack local languages
      const formattedCategory = categoryLocalMap[currentLang][row.category] || row.category;
      const formattedAttack = row.attack_type.toUpperCase();

      // Safely trim large descriptions
      const promptPreview = row.prompt_text.length > 55 
        ? row.prompt_text.slice(0, 55) + "..." 
        : row.prompt_text;

      tr.innerHTML = `
        <td class="px-6 py-4 font-mono text-xs font-bold text-slate-400 pointer-events-none">${row.prompt_id}</td>
        <td class="px-6 py-4 text-xs font-semibold text-white max-w-sm truncate" title="${row.prompt_text.replace(/"/g, '&quot;')}">${promptPreview}</td>
        <td class="px-6 py-4 text-xs font-bold text-indigo-300">${row.model_display}</td>
        <td class="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono tracking-wide">${formattedAttack}</td>
        <td class="px-6 py-4 text-xs text-slate-400 max-w-[150px] truncate">${formattedCategory}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${verdictBadgeClass}">
            ${row.verdict}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
          <button class="btn-view-details px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.08] text-xs text-white font-medium hover:text-indigo-400 transition cursor-pointer select-none" data-id="${row.prompt_id}">
            ${dict.btn_details}
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });
  }

  // Draw Mobile responsive layouts (Cards instead of compact tables)
  mobileContainer.innerHTML = "";
  if (filtered.length === 0) {
    mobileContainer.innerHTML = `
      <div class="text-center py-10 text-xs text-slate-500">
        ${dict.no_results}
      </div>
    `;
  } else {
    filtered.forEach(row => {
      const card = document.createElement("div");
      card.className = "p-5 space-y-3 hover:bg-white/[0.015] transition";
      
      let verdictBadgeClass = "";
      if (row.verdict === "JAILBROKEN") {
        verdictBadgeClass = "bg-red-500/10 text-red-400 border border-red-500/20";
      } else if (row.verdict === "REFUSED") {
        verdictBadgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      } else {
        verdictBadgeClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      }

      const formattedCategory = categoryLocalMap[currentLang][row.category] || row.category;
      const formattedAttack = attackLocalMap[currentLang][row.attack_type] || row.attack_type;

      const labelModel = currentLang === "VI" ? "Mô hình:" : "Model:";
      const labelVector = currentLang === "VI" ? "Dạng:" : "Vector:";
      const viewConversationBtnText = currentLang === "VI" ? "Xem nội dung hội thoại" : "View conversation dialogue";

      card.innerHTML = `
        <div class="flex justify-between items-start gap-2">
          <span class="font-mono text-xs font-bold bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-slate-300 rounded-md">${row.prompt_id}</span>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-md border ${verdictBadgeClass}">${row.verdict}</span>
        </div>
        <div>
          <h4 class="text-xs font-semibold text-white line-clamp-3 leading-relaxed">${row.prompt_text}</h4>
        </div>
        <div class="pt-1.5 flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span class="bg-white/[0.02] border border-white/[0.06] py-0.5 px-2 rounded">${labelModel} <b class="text-indigo-300 font-bold">${row.model_display}</b></span>
          <span class="bg-white/[0.02] border border-white/[0.06] py-0.5 px-2 rounded">${labelVector} <b class="text-slate-300">${formattedAttack}</b></span>
          <span class="bg-white/[0.02] border border-white/[0.06] py-0.5 px-2 rounded">${formattedCategory}</span>
        </div>
        <div class="flex justify-end pt-2">
          <button class="btn-view-details-mobile px-3 py-2 bg-[#0d1527] hover:bg-[#14203b] border border-white/[0.08] hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition w-full text-center" data-id="${row.prompt_id}">
            ${viewConversationBtnText}
          </button>
        </div>
      `;

      mobileContainer.appendChild(card);
    });
  }

  // Setup modal triggers for rendered rows
  const detailButtons = document.querySelectorAll(".btn-view-details, .btn-view-details-mobile");
  detailButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = btn.getAttribute("data-id");
      const targetItem = allResults.find(item => item.prompt_id === pId);
      if (targetItem) {
        openDetailModal(targetItem);
      }
    });
  });
}

// Open beautiful detailed raw prompt response modal
function openDetailModal(item: TestResult) {
  const modal = document.getElementById("detail-modal");
  const modalId = document.getElementById("modal-id-badge");
  const modalModel = document.getElementById("modal-meta-model");
  const modalAttack = document.getElementById("modal-meta-attack");
  const modalCategory = document.getElementById("modal-meta-category");
  const badgePlacer = document.getElementById("modal-verdict-badge-placeholder");
  
  const promptEl = document.getElementById("modal-prompt-content");
  const responseEl = document.getElementById("modal-response-content");
  const successTag = document.getElementById("response-success-tag");
  const modalCard = document.getElementById("detail-modal-card");

  if (!modal || !modalCard) return;

  const dict = translations[currentLang];

  // Set ID and Text
  if (modalId) modalId.innerText = item.prompt_id;
  if (modalModel) modalModel.innerText = item.model_display;
  
  const formattedAttack = attackLocalMap[currentLang][item.attack_type] || item.attack_type;
  if (modalAttack) modalAttack.innerText = formattedAttack.toUpperCase();
  
  const mappedCat = categoryLocalMap[currentLang][item.category] || item.category;
  if (modalCategory) modalCategory.innerText = mappedCat;

  // Setup Prompt markup
  if (promptEl) promptEl.innerText = item.prompt_text;

  // Set response output
  if (responseEl) {
    if (item.verdict === "ERROR") {
      responseEl.innerHTML = `<span class="text-amber-500 italic font-mono text-xs">${dict.modal_response_error}</span>`;
    } else if (item.response === null || item.response.trim() === "") {
      responseEl.innerHTML = `<span class="text-slate-500 italic font-mono text-xs">${dict.modal_response_empty}</span>`;
    } else {
      responseEl.innerText = item.response;
    }
  }

  // Design active safety tag indicators
  if (successTag) {
    if (item.verdict === "JAILBROKEN") {
      successTag.className = "text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide";
      successTag.innerText = dict.action_success_tag_jailbroken;
    } else if (item.verdict === "REFUSED") {
      successTag.className = "text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide";
      successTag.innerText = dict.action_success_tag_refused;
    } else {
      successTag.className = "text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide";
      successTag.innerText = dict.action_success_tag_error;
    }
  }

  // Verdict design pill
  if (badgePlacer) {
    let classificationTheme = "";
    if (item.verdict === "JAILBROKEN") {
      classificationTheme = "bg-red-500/20 text-red-350 border border-red-500/30";
    } else if (item.verdict === "REFUSED") {
      classificationTheme = "bg-emerald-500/20 text-emerald-350 border border-emerald-500/30";
    } else {
      classificationTheme = "bg-amber-500/20 text-amber-350 border border-amber-500/30";
    }
    badgePlacer.innerHTML = `<span class="inline-flex px-2.5 py-1 text-[10px] font-mono font-bold rounded-md ${classificationTheme}">${item.verdict}</span>`;
  }

  // Open modal animation flow
  modal.classList.remove("hidden");
  setTimeout(() => {
    modalCard.classList.remove("scale-95");
  }, 50);
}
