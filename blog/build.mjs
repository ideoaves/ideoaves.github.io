import fs from "node:fs";
import path from "node:path";
import { parseArticle, renderArticleBody, escapeAttr } from "./parser.mjs";

const BLOG_DIR = import.meta.dirname;
// 型紙は入れ子になっているよ。
//   frame.html     … ページ全体（head・ヘッダー・main）。<ページの中身> にページ種別ごとの中身が入る
//   blogframe.html … 記事ページの中身。<ブログの中身> に記事本文が入る
//   listframe.html … 記事一覧ページの中身。<ブログ一覧> に記事カードが並ぶ
// ページの種類が増えるときは、frame.html はそのままに ○○frame.html を足していけばいい。
const FRAME_PATH = path.join(BLOG_DIR, "frame.html");
const BLOGFRAME_PATH = path.join(BLOG_DIR, "blogframe.html");
const LISTFRAME_PATH = path.join(BLOG_DIR, "listframe.html");
const INDEX_PATH = path.join(BLOG_DIR, "index.html");
const JSON_PATH = path.join(BLOG_DIR, "bloglist.json");
const RSS_PATH = path.join(BLOG_DIR, "rss.xml");

const SITE = "https://ideoaves.github.io";
const BLOG_URL = `${SITE}/blog/`;
const BLOG_TITLE = "Ideoaves のブログ";
const BLOG_DESC = "Ideoavesのブログ";

const ページプレースホルダ = "<ページの中身>";
const 本文プレースホルダ = "<ブログの中身>";
const 一覧プレースホルダ = "<ブログ一覧>";

// このリポジトリのファイルは全部CRLFなので、読むときにLFへ正規化して、書くときにCRLFへ戻すよ。
// （Pythonのテキストモードと同じ挙動。混ざると差分がファイル全体に出てしまうため。）
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

// 型紙のプレースホルダを、その行の字下げに合わせて value で置き換えるよ。
// 1行目は型紙側の字下げに続くので足さない。空行にも足さない。
function fillSlot(template, placeholder, value) {
  const at = template.indexOf(placeholder);
  if (at === -1) {
    throw new Error(`型紙に ${placeholder} が見つからないよ。`);
  }
  const 行頭 = template.lastIndexOf("\n", at) + 1;
  const 字下げ = template.slice(行頭, at);
  const pad = /^[ \t]*$/.test(字下げ) ? 字下げ : "";
  const indented = value
    .split("\n")
    .map((line, i) => (i === 0 || line.trim() === "" ? line : pad + line))
    .join("\n");
  return template.split(placeholder).join(indented);
}

function setMeta(html, name, value) {
  const pattern = new RegExp(`<meta name="${name}" content="[^"]*">`);
  return replaceOnce(html, pattern, `<meta name="${name}" content="${escapeAttr(value)}">`);
}

// テンプレ
const frameHtml = readText(FRAME_PATH);
const blogframeHtml = readText(BLOGFRAME_PATH).trimEnd();
const listframeHtml = readText(LISTFRAME_PATH).trimEnd();

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
  const 記事の中身 = fillSlot(blogframeHtml, 本文プレースホルダ, renderArticleBody(article));
  let html = fillSlot(frameHtml, ページプレースホルダ, 記事の中身);

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
  const hiduke = filename.slice(0, filename.lastIndexOf("."));
  const outputFilename = `${hiduke}.html`;
  const dateStr = hiduke.slice(0, 10);

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

  console.log(`  + ${outputFilename}`);
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
    // 字下げは listframe.html の <ブログ一覧> の位置に合わせて後から付くので、ここでは付けないよ。
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

// listframe.html の <ブログ一覧> にカードを並べて、それを frame.html の <ページの中身> に入れるよ。
const 一覧の中身 = fillSlot(listframeHtml, 一覧プレースホルダ, cards);
const indexHtml = fillSlot(frameHtml, ページプレースホルダ, 一覧の中身);

writeText(INDEX_PATH, indexHtml);

// rss.xmlの生成

const 曜日 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const 月 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-04-02" をRSSのpubDate形式にするよ。
function rfc822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${曜日[d.getUTCDay()]}, ${dd} ${月[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 +0900`;
}

const items = blogs
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
const lastBuild = blogs.length ? rfc822(blogs[0].date) : "";

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

console.log(`ブログ更新　いえい。（記事 ${txtFiles.length} 本を変換、一覧 ${blogs.length} 件）`);
