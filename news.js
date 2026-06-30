export default async function handler(req, res) {
  const { query = "KB Pay", display = "20", sort = "date" } = req.query;

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: "Vercel 환경변수 NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다."
    });
  }

  const displayNumber = Math.min(Math.max(Number(display) || 20, 1), 100);
  const normalizedSort = sort === "sim" ? "sim" : "date";

  const apiUrl =
    "https://openapi.naver.com/v1/search/news.json?" +
    new URLSearchParams({
      query,
      display: String(displayNumber),
      start: "1",
      sort: normalizedSort
    }).toString();

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "네이버 뉴스 API 호출에 실패했습니다.",
        detail: text
      });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({
      error: "서버리스 함수 실행 중 오류가 발생했습니다.",
      detail: error.message
    });
  }
}
