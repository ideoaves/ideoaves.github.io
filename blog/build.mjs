import fs from "node:fs";
import path from "node:path";
import { parseArticle, renderArticleBody, escapeAttr } from "./parser.mjs";

const BLOG_DIR = import.meta.dirname;
//   frame.html     … ページ全体（head・ヘッダー・main）。<ページの中身> にページ種別ごとの中身が入る
//   blogframe.html … 記事ページの中身。<ブログの中身> に記事本文が入る
// ページの種類が増えるときは、frame.html はそのままに ○○frame.html を足していけばいい。
const FRAME_PATH = path.join(BLOG_DIR, "frame.html");
const BLOGFRAME_PATH = path.join(BLOG_DIR, "blogframe.html");
const INDEX_PATH = path.join(BLOG_DIR, "index.html");
const JSON_PATH = path.join(BLOG_DIR, "bloglist.json");
const RSS_PATH = path.join(BLOG_DIR, "rss.xml");

const SITE = "https://ideoaves.github.io";
const BLOG_URL = `${SITE}/blog/`;
const BLOG_TITLE = "Ideoaves のブログ";
const BLOG_DESC = "Ideoavesのブログ";

const PAGE_SLOT = "<ページの中身>";
const BODY_SLOT = "<ブログの中身>";
const CARD_LIST_TAG = '<div class="横に狭い分類 ブログ群">';

// 読むときにLFへ正規化して、書くときにCRLFへ戻すよ。
function readText(file) {
  return fs.readFileSync(file, "utf-8").replace(/\r\n|\r/g, "\n");
}

function writeText(file, text) {
  fs.writeFileSync(file, text.replace(/\r\n|\r|\n/g, "\r\n"), "utf-8");
}

function escapeText(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(text) {
  return escapeText(text).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// 置換文字列に含まれる $ が特殊解釈されないよう、replaceには必ず関数を渡すよ。
function replaceOnce(html, pattern, value) {
  return html.replace(pattern, () => value);
}

// その位置の行頭の字下げを返すよ。字下げ以外の文字が前にあるときは空文字を返すよ。
function indentAt(text, at) {
  const lineStart = text.lastIndexOf("\n", at) + 1;
  const indent = text.slice(lineStart, at);
  return /^[ \t]*$/.test(indent) ? indent : "";
}

// 型紙のプレースホルダを、その行の字下げに合わせて value で置き換えるよ。
function fillSlot(template, placeholder, value) {
  const at = template.indexOf(placeholder);
  if (at === -1) {
    throw new Error(`型紙に ${placeholder} が見つからないよ。`);
  }
  const pad = indentAt(template, at);
  const indented = value
    .split("\n")
    .map((line, i) => (i === 0 || line.trim() === "" ? line : pad + line))
    .join("\n");
  return template.split(placeholder).join(indented);
}

// 開始位置から <div> の入れ子を数えて、対応する </div> の位置を返すよ。
function findClosingDiv(html, from) {
  const divTag = /<div\b|<\/div\s*>/g;
  divTag.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = divTag.exec(html)) !== null) {
    depth += m[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return m.index;
  }
  throw new Error(`index.html の ${CARD_LIST_TAG} が閉じてないです`);
}

// index.html のブログ群のdivの中身だけを差し替えるよ。
function replaceCardList(html, cards) {
  const at = html.indexOf(CARD_LIST_TAG);
  if (at === -1) {
    throw new Error(`index.html に ${CARD_LIST_TAG} が見つからないです`);
  }
  const innerStart = at + CARD_LIST_TAG.length;
  const innerEnd = findClosingDiv(html, innerStart);

  // 開始タグの字下げに合わせて、カードはその1段内側に置くよ。
  const pad = indentAt(html, at);
  const inner = cards
    .split("\n")
    .map((line) => (line.trim() === "" ? line : pad + "    " + line))
    .join("\n");

  return html.slice(0, innerStart) + "\n" + inner + "\n" + pad + html.slice(innerEnd);
}

function setMeta(html, name, value) {
  const pattern = new RegExp(`<meta name="${name}" content="[^"]*">`);
  return replaceOnce(html, pattern, `<meta name="${name}" content="${escapeAttr(value)}">`);
}

// テンプレ
const frameHtml = readText(FRAME_PATH);
const blogframeHtml = readText(BLOGFRAME_PATH).trimEnd();

// bloglist.jsonから既存のブログデータを読み込むよ。ファイルがなければ空のオブジェクトで始めるよ。
let blogsData = {};
try {
  blogsData = JSON.parse(readText(JSON_PATH));
} catch {
  blogsData = {};
}

// jsonに記載されているが、対応する.htmlファイルが存在しない記事の情報を削除するよ。
for (const blogFilename of Object.keys(blogsData)) {
  if (!fs.existsSync(path.join(BLOG_DIR, blogFilename))) {
    console.warn(`  ! ${blogFilename} のHTMLが無いのでjsonから消しました`);
    delete blogsData[blogFilename];
  }
}

// 記事ページの生成

// 個別記事のページを、テンプレートに流し込んで組み立てるよ。
function renderArticlePage(article) {
  const articleInner = fillSlot(blogframeHtml, BODY_SLOT, renderArticleBody(article));
  let html = fillSlot(frameHtml, PAGE_SLOT, articleInner);

  html = replaceOnce(
    html,
    /<title>.*?<\/title>/s,
    `<title>${escapeText(article.title)} ( 𝐼𝑑𝑒𝑜𝑎𝑣𝑒𝑠 )</title>`,
  );
  html = setMeta(html, "description", article.summary20);
  html = setMeta(html, "twitter:title", article.title);
  html = setMeta(html, "twitter:description", article.summary20);
  html = setMeta(html, "twitter:image", `${BLOG_URL}${article.firstImg}`);

  return html;
}

const txtFiles = fs
  .readdirSync(BLOG_DIR)
  .filter((name) => name.endsWith(".txt"))
  .sort();

for (const filename of txtFiles) {
  const basename = filename.slice(0, filename.lastIndexOf("."));
  const outputFilename = `${basename}.html`;
  const dateStr = basename.slice(0, 10);

  const text = readText(path.join(BLOG_DIR, filename));
  const article = parseArticle(text);

  writeText(path.join(BLOG_DIR, outputFilename), renderArticlePage(article));

  blogsData[outputFilename] = {
    filename: outputFilename,
    title: article.title,
    img: article.firstImg,
    summary: article.summary100,
    date: dateStr,
    author: article.authorId,
  };
}

// index.html（記事一覧ページ）の生成

// 記事を日付の新しい順に並び替えるよ。
const blogs = Object.values(blogsData).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const cards = blogs
  .map((b) => {
    const authorIds = b.author
      .split(/\s+/)
      .filter(Boolean)
      .map((author) => `${author}の記事`)
      .join(" ");
    // 字下げは index.html のブログ群のdivの位置に合わせて後から付くので、ここでは付けないよ。
    return [
      `<a class="ブログ" id="${escapeAttr(authorIds)}" href="${escapeAttr(b.filename)}">`,
      `    <div class="ブログのサムネイル"><img alt="" src="${escapeAttr(b.img ?? "")}"></div>`,
      `    <div class="ブログのタイトル">`,
      `        <h2>${b.title}</h2>`,
      `    </div>`,
      `    <div class="ブログの投稿時間">${b.date}</div>`,
      `    <div class="ブログの最初">${b.summary}<br></div>`,
      `</a>`,
    ].join("\n");
  })
  .join("\n");

// index.html の「ブログ群」のdivの中身だけをカード一覧で入れ替えるよ。ページの他の部分は触らないよ。
writeText(INDEX_PATH, replaceCardList(readText(INDEX_PATH), cards));

// rss.xmlの生成

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-04-02" をRSSのpubDate形式にするよ。
function rfc822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]}, ${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 +0900`;
}

// 未来の日付の記事除外。並びが壊れたり先頭に居座ったりして購読側に迷惑をかけるため。
const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const feedBlogs = blogs.filter((b) => b.date <= todayJST);

const items = feedBlogs
  .map((b) => {
    const url = `${BLOG_URL}${b.filename}`;
    const creator = b.author
      ? `\n            <dc:creator>${escapeXml(b.author)}</dc:creator>`
      : "";
    return `        <item>
            <title>${escapeXml(b.title)}</title>
            <link>${escapeXml(url)}</link>
            <guid isPermaLink="true">${escapeXml(url)}</guid>
            <pubDate>${rfc822(b.date)}</pubDate>${creator}
            <description>${escapeXml(b.summary)}</description>
        </item>`;
  })
  .join("\n");

// lastBuildDateは最新記事の日付にしておくよ。実行時刻にすると、中身が変わっていなくても毎回gitの差分が出てしまうため。
const lastBuild = feedBlogs.length ? rfc822(feedBlogs[0].date) : "";

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <channel>
        <title>${escapeXml(BLOG_TITLE)}</title>
        <link>${escapeXml(BLOG_URL)}</link>
        <description>${escapeXml(BLOG_DESC)}</description>
        <language>ja</language>
        <lastBuildDate>${lastBuild}</lastBuildDate>
        <atom:link href="${escapeXml(BLOG_URL)}rss.xml" rel="self" type="application/rss+xml"/>
${items}
    </channel>
</rss>
`;

writeText(RSS_PATH, rss);

// 最後に、更新したブログ情報をJSONファイルに保存するよ

writeText(JSON_PATH, JSON.stringify(blogsData, null, 4) + "\n");

console.log(
  `ブログ更新　いえい。（記事 ${txtFiles.length} 本を変換、一覧 ${blogs.length} 件、RSS ${feedBlogs.length} 件）`,
);
