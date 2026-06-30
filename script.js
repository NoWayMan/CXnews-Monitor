const searchInput = document.getElementById("searchInput");
const displayInput = document.getElementById("displayInput");
const sortSelect = document.getElementById("sortSelect");
const searchButton = document.getElementById("searchButton");
const downloadButton = document.getElementById("downloadButton");
const resultBody = document.getElementById("resultBody");
const summaryBox = document.getElementById("summaryBox");
const statusBox = document.getElementById("statusBox");
const resultCount = document.getElementById("resultCount");
const tagFilter = document.getElementById("tagFilter");
const sentimentFilter = document.getElementById("sentimentFilter");
const tableSearchInput = document.getElementById("tableSearchInput");

let allRows = [];
let filteredRows = [];

const issueRules = [
  { tag: "앱/UX", keywords: ["앱", "어플", "오류", "접속", "로그인", "인증", "UI", "UX", "화면", "메뉴", "속도", "간편결제", "페이"] },
  { tag: "혜택/상품", keywords: ["혜택", "할인", "포인트", "포인트리", "마일리지", "캐시백", "이벤트", "쿠폰", "프로모션", "적립"] },
  { tag: "상담/콜센터", keywords: ["상담", "콜센터", "ARS", "대기", "연결", "고객센터", "챗봇", "콜봇", "상담원"] },
  { tag: "지점/대면", keywords: ["지점", "영업점", "대기시간", "창구", "번호표", "방문", "로비", "대면"] },
  { tag: "신뢰/장애", keywords: ["장애", "먹통", "보안", "개인정보", "해킹", "피해", "민원", "유출", "사고"] },
  { tag: "수수료/금리", keywords: ["수수료", "금리", "이자", "연회비", "대출", "카드론", "리볼빙", "한도"] },
  { tag: "브랜드/평판", keywords: ["만족도", "평판", "고객경험", "소비자", "불만", "개선", "브랜드", "순위"] }
];

searchButton.addEventListener("click", fetchNews);
downloadButton.addEventListener("click", () => downloadCSV(filteredRows));
tagFilter.addEventListener("change", applyFilters);
sentimentFilter.addEventListener("change", applyFilters);
tableSearchInput.addEventListener("input", applyFilters);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") fetchNews();
});

async function fetchNews() {
  const query = searchInput.value.trim();
  const display = Number(displayInput.value || 20);
  const sort = sortSelect.value || "date";

  if (!query) {
    setStatus("검색 키워드를 입력하세요.", "error");
    return;
  }

  if (display < 1 || display > 100) {
    setStatus("검색 개수는 1~100 사이로 입력하세요.", "error");
    return;
  }

  searchButton.disabled = true;
  downloadButton.disabled = true;
  setStatus("뉴스를 조회하는 중입니다.", "");
  renderLoading();

  try {
    const params = new URLSearchParams({
      query,
      display: String(display),
      sort
    });

    const response = await fetch(`/api/news?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "API 호출에 실패했습니다.");
    }

    allRows = normalizeNewsItems(data.items || []);
    filteredRows = [...allRows];

    populateTagFilter(allRows);
    applyFilters();

    const total = data.total ? Number(data.total).toLocaleString("ko-KR") : "-";
    setStatus(`조회 완료: 네이버 검색 총 결과 ${total}건 중 ${allRows.length}건을 수집했습니다.`, "success");
  } catch (error) {
    allRows = [];
    filteredRows = [];
    renderSummary([]);
    renderTable([]);
    setStatus(`오류가 발생했습니다: ${error.message}`, "error");
  } finally {
    searchButton.disabled = false;
    downloadButton.disabled = false;
  }
}

function normalizeNewsItems(items) {
  return items.map((item) => {
    const title = cleanHtml(item.title);
    const description = cleanHtml(item.description);
    const fullText = `${title} ${description}`;

    return {
      date: formatPubDate(item.pubDate),
      title,
      description,
      link: item.link || "",
      originalLink: item.originallink || "",
      issueTag: detectIssueTag(fullText),
      sentiment: detectSentiment(fullText),
      memo: createReportMemo(fullText)
    };
  });
}

function cleanHtml(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(text || "");
  return textarea.value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPubDate(pubDate) {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return pubDate;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function detectIssueTag(text) {
  for (const rule of issueRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.tag;
    }
  }

  return "기타";
}

function detectSentiment(text) {
  const negativeWords = ["불만", "장애", "먹통", "피해", "민원", "논란", "불편", "오류", "지연", "중단", "실패", "유출", "해킹"];
  const positiveWords = ["개선", "강화", "확대", "혜택", "편의", "성장", "호평", "만족", "인기", "출시", "개편"];

  const negativeCount = negativeWords.filter((word) => text.includes(word)).length;
  const positiveCount = positiveWords.filter((word) => text.includes(word)).length;

  if (negativeCount > positiveCount) return "부정 추정";
  if (positiveCount > negativeCount) return "긍정 추정";
  return "중립/판단보류";
}

function createReportMemo(text) {
  if (text.includes("불편") || text.includes("불만") || text.includes("민원") || text.includes("장애")) {
    return "고객 불편 또는 부정 경험 이슈로 검토 필요";
  }

  if (text.includes("혜택") || text.includes("할인") || text.includes("포인트") || text.includes("캐시백")) {
    return "혜택 체감 및 상품 경쟁력 관련 근거로 활용 가능";
  }

  if (text.includes("앱") || text.includes("인증") || text.includes("접속") || text.includes("로그인")) {
    return "디지털 채널 사용성 이슈로 분류 가능";
  }

  if (text.includes("상담") || text.includes("ARS") || text.includes("고객센터") || text.includes("대기")) {
    return "상담 채널 접근성 및 응대 경험 관점에서 검토 가능";
  }

  if (text.includes("지점") || text.includes("영업점") || text.includes("창구")) {
    return "대면 채널 운영 및 대기 경험 관점에서 검토 가능";
  }

  return "보고서 활용 가능성 추가 검토 필요";
}

function populateTagFilter(rows) {
  const tags = Array.from(new Set(rows.map((row) => row.issueTag))).sort((a, b) => a.localeCompare(b, "ko-KR"));
  tagFilter.innerHTML = [
    `<option value="전체">전체</option>`,
    ...tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
  ].join("");
}

function applyFilters() {
  const selectedTag = tagFilter.value;
  const selectedSentiment = sentimentFilter.value;
  const keyword = tableSearchInput.value.trim().toLowerCase();

  filteredRows = allRows.filter((row) => {
    const tagMatched = selectedTag === "전체" || row.issueTag === selectedTag;
    const sentimentMatched = selectedSentiment === "전체" || row.sentiment === selectedSentiment;
    const keywordMatched = !keyword ||
      `${row.title} ${row.description} ${row.memo} ${row.issueTag} ${row.sentiment}`.toLowerCase().includes(keyword);

    return tagMatched && sentimentMatched && keywordMatched;
  });

  renderSummary(filteredRows);
  renderTable(filteredRows);
}

function renderSummary(rows) {
  const tagCounts = countBy(rows, "issueTag");
  const sentimentCounts = countBy(rows, "sentiment");
  const topTag = getTopEntry(tagCounts);
  const negativeCount = sentimentCounts["부정 추정"] || 0;

  summaryBox.innerHTML = `
    <div class="summary-card">
      <span>현재 표시 건수</span>
      <strong>${rows.length.toLocaleString("ko-KR")}건</strong>
    </div>
    <div class="summary-card">
      <span>주요 이슈 태그</span>
      <strong>${topTag ? `${topTag[0]} ${topTag[1]}건` : "-"}</strong>
    </div>
    <div class="summary-card">
      <span>부정 추정 이슈</span>
      <strong>${negativeCount.toLocaleString("ko-KR")}건</strong>
    </div>
    <div class="summary-card">
      <span>태그 유형 수</span>
      <strong>${Object.keys(tagCounts).length.toLocaleString("ko-KR")}개</strong>
    </div>
  `;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function getTopEntry(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function renderLoading() {
  resultBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty">뉴스를 불러오는 중입니다.</td>
    </tr>
  `;
  resultCount.textContent = "조회 중";
}

function renderTable(rows) {
  resultCount.textContent = `${rows.length.toLocaleString("ko-KR")}건`;

  if (!rows.length) {
    resultBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">표시할 결과가 없습니다.</td>
      </tr>
    `;
    return;
  }

  resultBody.innerHTML = rows
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.title)}</td>
        <td>${escapeHtml(row.description)}</td>
        <td><span class="tag">${escapeHtml(row.issueTag)}</span></td>
        <td><span class="sentiment ${getSentimentClass(row.sentiment)}">${escapeHtml(row.sentiment)}</span></td>
        <td>${escapeHtml(row.memo)}</td>
        <td><a href="${escapeAttribute(row.link)}" target="_blank" rel="noopener noreferrer">보기</a></td>
      </tr>
    `)
    .join("");
}

function getSentimentClass(sentiment) {
  if (sentiment === "부정 추정") return "negative";
  if (sentiment === "긍정 추정") return "positive";
  return "neutral";
}

function downloadCSV(rows) {
  if (!rows.length) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  const headers = ["날짜", "제목", "요약", "이슈태그", "감성추정", "보고서메모", "URL", "원문URL"];
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.date,
        row.title,
        row.description,
        row.issueTag,
        row.sentiment,
        row.memo,
        row.link,
        row.originalLink
      ]
        .map(toCsvCell)
        .join(",")
    )
  ];

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cx_news_voc_monitor_${now}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function setStatus(message, type) {
  statusBox.className = `status-box ${type || ""}`.trim();
  statusBox.innerHTML = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

// 초기 상태
renderSummary([]);
downloadButton.disabled = true;
