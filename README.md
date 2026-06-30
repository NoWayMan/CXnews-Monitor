# CX News/VOC Monitor

네이버 뉴스 검색 API를 활용해 키워드별 뉴스 이슈를 수집하고, CX 관점의 이슈 태그·감성 추정·보고서 메모를 자동 분류하는 웹페이지입니다.

## 파일 구조

```text
cx-news-voc-monitor/
├─ index.html
├─ style.css
├─ script.js
├─ api/
│  └─ news.js
├─ package.json
└─ README.md
```

## 네이버 개발자센터 설정

1. 네이버 개발자센터에서 애플리케이션 등록
2. 사용 API: `검색`
3. 발급된 `Client ID`, `Client Secret` 확인
4. Client Secret이 노출된 경우 반드시 `재발급` 권장

## Vercel 환경변수

Vercel 프로젝트의 Settings > Environment Variables에 아래 값을 추가합니다.

```text
NAVER_CLIENT_ID=본인_Client_ID
NAVER_CLIENT_SECRET=본인_Client_Secret
```

주의: 이 값은 `script.js`, `index.html`에 직접 넣지 마세요.

## 로컬 실행

Vercel CLI가 필요합니다.

```bash
npm i -g vercel
vercel login
vercel dev
```

브라우저에서 아래 주소 접속:

```text
http://localhost:3000
```

## 배포

```bash
vercel --prod
```

또는 GitHub 저장소에 올린 뒤 Vercel에서 Import Project로 배포할 수 있습니다.

## 주요 기능

- 키워드 뉴스 검색
- 최신순/정확도순 정렬
- CX 이슈 태그 자동 분류
- 감성 추정
- 보고서 메모 자동 생성
- 결과 내 검색
- 태그/감성 필터
- CSV 다운로드

## 다음 확장안

- OpenAI API 기반 3줄 요약
- 보고서 문장 자동 생성
- 앱스토어 리뷰/VOC 업로드 분석
- 키워드 묶음 검색
- 특정 기간별 모니터링
