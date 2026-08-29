// 大変個人用途の雑なビルダーなので、利用をおすすめしません。色々例外処理を想定していないです。
// L2 Human Understood
import fs from "node:fs";
import path from "node:path";
import {
  txt2html,
  renderArticleBody,
  escapeAttr,
  isAbsoluteUrl,
  isLinkTarget,
  splitLabel,
} from "./parser.mjs";

const BLOG_DIR = import.meta.dirname;
const FRAME_PATH = path.join(BLOG_DIR, "frame.html");
const BLOGFRAME_PATH = path.join(BLOG_DIR, "blogframe.html");
const LINKFRAME_PATH = path.join(BLOG_DIR, "linkframe.html");
const INDEX_PATH = path.join(BLOG_DIR, "index.html");
const JSON_PATH = path.join(BLOG_DIR, "bloglist.json");
const RSS_PATH = path.join(BLOG_DIR, "rss.xml");
const LINKLIST_PATH = path.join(BLOG_DIR, "linklist.json");

const SITE = "https://ideoaves.github.io";
const BLOG_URL = `${SITE}/blog/`;
const BLOG_TITLE = "Ideoaves のブログ";
const BLOG_DESC = "Ideoavesのブログ";

const PAGE_SLOT = "<ページの中身>";
const BODY_SLOT = "<ブログの中身>";
const RELATED_SLOT = "<関連記事>";
const CARD_LIST_TAG = '<div class="横に狭い分類 ブログ群">';

// CRLFとLF変換たちの装置
function readText(file) {
  return fs.readFileSync(file, "utf-8").replace(/\r\n|\r/g, "\n");
}
function writeText(file, text) {
  fs.writeFileSync(file, text.replace(/\r\n|\r|\n/g, "\r\n"), "utf-8");
}

// [ithum ] OR 最初の画像のリンク装置
function coverImage(images) {
  return (images.find((img) => img.thumb) ?? images[0])?.src ?? "";
}

// 冒頭n文字ぶんの文章
function summarize(bodyHtml, n) {
  const text = bodyHtml
    .replace(/<div class="目次">.*?<\/div>/gs, "")
    .replace(/<span class="カーソルを"[^>]*><span>(.*?)<\/span>.*?<\/span>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/\s+/g, " ");
  return text.length > n ? text.slice(0, n) + "..." : text;
}

// XML用に"'"を追加したエスケープ装置
function escapeXml(text) {
  return escapeAttr(text).replaceAll("'", "&apos;");
}

// $系のプレーン化装置
function replaceOnce(html, pattern, value) {
  return html.replace(pattern, () => value);
}

// 行頭の字下げ装置
function indentAt(text, at) {
  const lineStart = text.lastIndexOf("\n", at) + 1;
  const indent = text.slice(lineStart, at);
  return /^[ \t]*$/.test(indent) ? indent : "";
}

// プレースホルダをその行の字下げに合わせvalueで置き換える
function fillSlot(template, placeholder, value) {
  const at = template.indexOf(placeholder);
  const pad = indentAt(template, at);
  if (value === "") return template.split(`${pad}${placeholder}\n`).join("");
  const indented = value
    .split("\n")
    .map((line, i) => (i === 0 || line.trim() === "" ? line : pad + line))
    .join("\n");
  return template.split(placeholder).join(indented);
}

//metaタグの編集
function setMeta(html, name, value) {
  const pattern = new RegExp(`<meta name="${name}" content="[^"]*">`);
  return replaceOnce(html, pattern, `<meta name="${name}" content="${escapeAttr(value)}">`);
}

// ここからビルド処理

const frameHtml = readText(FRAME_PATH);
const blogframeHtml = readText(BLOGFRAME_PATH).trimEnd();
const linkframeHtml = readText(LINKFRAME_PATH).trimEnd();

// list.jsonから既存のデータを読み込む
let blogsData = {};
try {
  blogsData = JSON.parse(readText(JSON_PATH));
} catch {
  blogsData = {};
}
let linksData = {};
try {
  linksData = JSON.parse(readText(LINKLIST_PATH));
} catch {
  linksData = {};
}

// htmlファイルの有無の更新
for (const blogFilename of Object.keys(blogsData)) {
  if (!fs.existsSync(path.join(BLOG_DIR, blogFilename))) {
    delete blogsData[blogFilename];
  }
}

// 記事の読み込み
const txtFiles = fs
  .readdirSync(BLOG_DIR)
  .filter((name) => name.endsWith(".txt"))
  .sort();
// htmlファイルの名前と日付を取得
const articles = txtFiles.map((filename) => {
  const basename = filename.slice(0, filename.lastIndexOf("."));
  const text = readText(path.join(BLOG_DIR, filename));
  return {
    filename,
    path: path.join(BLOG_DIR, filename),
    outputFilename: `${basename}.html`,
    date: basename.slice(0, 10),
    text,
    title: text.trim().split(/\r\n|\r|\n/, 1)[0].trim(),
  };
});
// タイトルの変更を検出
const 前回のタイトル = new Map(Object.values(blogsData).map((b) => [b.txt, b.title]));
const renames = new Map();
for (const a of articles) {
  const before = 前回のタイトル.get(a.filename);
  if (before && a.title && before !== a.title) renames.set(before, a.title);
}
// 他の記事の[タイトル]を置換
for (const a of articles) {
  let text = a.text;
  for (const [before, after] of renames) {
    const count = text.split(`[${before}]`).length - 1;
    if (!count) continue;
    text = text.split(`[${before}]`).join(`[${after}]`);
    console.log(`  ${a.filename}: [${before}] → [${after}] を ${count} 件置換しました`);
  }
  if (text === a.text) continue;
  a.text = text;
  writeText(a.path, text);
}
// 本文のないページのURLはそのタイトルが改名されても引き継ぐ
for (const [before, after] of renames) {
  if (linksData[before] === undefined) continue;
  linksData[after] = linksData[before];
  delete linksData[before];
}
// 先に本文のないページが生えていた記事はそのURLをそのまま名乗る
for (const a of articles) {
  if (linksData[a.title]) a.outputFilename = linksData[a.title];
}
for (const a of articles) a.parsed = txt2html(a.text);

// list.jsonの更新
for (const a of articles) {
  blogsData[a.outputFilename] = {
    filename: a.outputFilename,
    txt: a.filename,
    title: a.parsed.title,
    img: coverImage(a.parsed.images),
    summary: summarize(a.parsed.bodyHtml, 100),
    date: a.date,
    author: a.parsed.authorId,
    links: a.parsed.links,
  };
}

// リンクのグラフ
const titleToFile = new Map(Object.values(blogsData).map((b) => [b.title, b.filename]));
const fileToTitle = new Map(Object.values(blogsData).map((b) => [b.filename, b.title]));
for (const b of Object.values(blogsData)) {
  if (!b.links) continue;
  const nodes = b.links.map((node) => {
    const local = node.startsWith(BLOG_URL) ? node.slice(BLOG_URL.length) : node;
    return fileToTitle.get(local) ?? fileToTitle.get(`${local}.html`) ?? splitLabel(node, titleToFile)[1];
  });
  b.links = [...new Set(nodes)];
}
const outLinks = new Map();
const inLinks = new Map();
for (const b of Object.values(blogsData)) {
  outLinks.set(b.title, b.links ?? []);
  for (const to of b.links ?? []) {
    if (!inLinks.has(to)) inLinks.set(to, []);
    inLinks.get(to).push(b.title);
  }
}

// frame.htmlへのheader周りの流し込み
function renderPage(inner, title, description, image) {
  let html = fillSlot(frameHtml, PAGE_SLOT, inner);
  html = replaceOnce(
    html,
    /<title>.*?<\/title>/s,
    `<title>${escapeAttr(title)} ( 𝐼𝑑𝑒𝑜𝑎𝑣𝑒𝑠 )</title>`,
  );
  html = setMeta(html, "description", description);
  html = setMeta(html, "twitter:title", title);
  html = setMeta(html, "twitter:description", description);
  html = setMeta(html, "twitter:image", image);
  return html;
}

// 本文のないタイトルのページ。名前は見つけた日とその日の連番で、linklist.jsonに覚えておく
function emptyPageFile(title, n = 0) {
  if (linksData[title]) return linksData[title];
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const name = `${today}_${String(n).padStart(2, "0")}.html`;
  if (Object.values(linksData).includes(name)) return emptyPageFile(title, n + 1);
  linksData[title] = name;
  return name;
}

// ノードの行き先。
function nodeHref(node) {
  if (isLinkTarget(node)) return null;
  return titleToFile.get(node) ?? emptyPageFile(node);
}

// 空リンクclassのふりわけ
function nodeAnchor(node) {
  const cls = titleToFile.has(node) ? "記事リンク" : "記事リンク 空リンク";
  const href = nodeHref(node).replace(/[%#?\s]/g, (c) => encodeURIComponent(c));
  return `<a class="${cls}" href="${escapeAttr(href)}">`;
}

// 関連記事の3段落を作る
function renderRelated(node) {
  const inbound = new Set(inLinks.get(node) ?? []);
  const outbound = new Set(outLinks.get(node) ?? []);

  const siblings = new Set();
  for (const [title, targets] of outLinks) {
    if (title === node || inbound.has(title) || outbound.has(title)) continue;
    if (targets.some((to) => outbound.has(to))) siblings.add(title);
  }
  const group = (nodes, cls) => {
    const links = [...nodes]
      .filter((n) => n !== node && nodeHref(n) !== null)
      .sort((a, b) => {
        const fa = titleToFile.get(a);
        const fb = titleToFile.get(b);
        if (fa && fb) return blogsData[fa].date < blogsData[fb].date ? 1 : -1;
        if (fa || fb) return fa ? -1 : 1;
        return a < b ? -1 : 1;
      })
      .map((n) => `${nodeAnchor(n)}${n}</a>`);
    return links.length ? `<div class="${cls}">${links.join("")}</div>\n` : "";
  };
  const body =
    group(inbound, "inリンク") +
    group(outbound, "outリンク") +
    group(siblings, "sameリンク");
  return body ? `<div class="関連記事">\n${body}</div>` : "";
}
const emptyTitles = new Set();
for (const b of Object.values(blogsData)) {
  for (const to of b.links ?? []) {
    if (!isLinkTarget(to) && !titleToFile.has(to)) emptyTitles.add(to);
  }
}
// 誰も指さなくなったタイトルのページを消す
for (const [title, 名前] of Object.entries(linksData)) {
  // 記事になったタイトルは、そのURLを記事が名乗っているので記録ごと残すよ。
  if (emptyTitles.has(title) || titleToFile.has(title)) continue;
  fs.rmSync(path.join(BLOG_DIR, 名前), { force: true });
  delete linksData[title];
}
// 本文のないタイトルのページを生成
for (const title of emptyTitles) {
  let inner = fillSlot(
    linkframeHtml,
    BODY_SLOT,
    renderArticleBody({ title, authorId: "", bodyHtml: "" }).trimEnd(),
  );
  inner = fillSlot(inner, RELATED_SLOT, renderRelated(title));
  writeText(
    path.join(BLOG_DIR, emptyPageFile(title)),
    renderPage(inner, title, `${title}`, `${SITE}/icon.png`),
  );
}

// 記事ページの生成
for (const a of articles) {
  const bodyHtml = a.parsed.bodyHtml.replace(
    /<a class="記事リンク" data-記事="(\d+)">[^<]*<\/a>/g,
    (whole, n) => {
      const [label, node] = splitLabel(a.parsed.articleLinks[n], titleToFile);
      return `${nodeAnchor(node)}${label || node}</a>`;
    },
  );
  const article = { ...a.parsed, bodyHtml };
  let inner = fillSlot(blogframeHtml, BODY_SLOT, renderArticleBody(article));
  inner = fillSlot(inner, RELATED_SLOT, renderRelated(article.title));

  const cover = coverImage(a.parsed.images);
  const imageUrl = isAbsoluteUrl(cover) ? cover : `${BLOG_URL}${cover}`;

  writeText(
    path.join(BLOG_DIR, a.outputFilename),
    renderPage(inner, article.title, summarize(bodyHtml, 20), imageUrl),
  );
}

// blog/index.htmlの生成

// 記事を日付の新しい順に並び替えるよ。
const blogs = Object.values(blogsData).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
// 記事のカードを生成するよ。
const cards = blogs
  .map((b) => {
    const authorClasses = b.author
      .split(/\s+/)
      .filter(Boolean)
      .map((author) => `${author}の記事`)
      .join(" ");
    const cardClasses = authorClasses ? `ブログ ${authorClasses}` : "ブログ";
    const thumbnail = b.img ? `<img alt="" src="${escapeAttr(b.img)}">` : "";
    return [
      `<a class="${escapeAttr(cardClasses)}" href="${escapeAttr(b.filename)}">`,
      `    <div class="ブログのサムネイル">${thumbnail}</div>`,
      `    <div class="ブログのタイトル">`,
      `        <h2>${b.title}</h2>`,
      `    </div>`,
      `    <div class="ブログの投稿時間">${b.date}</div>`,
      ...(b.img ? [] : [`    <div class="ブログの最初">${b.summary}<br></div>`]),
      `</a>`,
    ].join("\n");
  })
  .join("\n");
// index.htmlに記事のカードを追加するよ。
const indexHtml = readText(INDEX_PATH);
const listAt = indexHtml.indexOf(CARD_LIST_TAG);
if (listAt === -1) {
  throw new Error(`index.html に ${CARD_LIST_TAG} が見つからないです`);
}
const innerStart = listAt + CARD_LIST_TAG.length;
let depth = 1;
const closing = [...indexHtml.slice(innerStart).matchAll(/<div\b|<\/div\s*>/g)]
  .find((m) => (depth += m[0].startsWith("</") ? -1 : 1) === 0);
if (!closing) {
  throw new Error(`index.html の ${CARD_LIST_TAG} が閉じてないです`);
}
const listPad = indentAt(indexHtml, listAt);
const inner = cards
  .split("\n")
  .map((line) => (line.trim() === "" ? line : listPad + "    " + line))
  .join("\n");
writeText(
  INDEX_PATH,
  indexHtml.slice(0, innerStart) + "\n" + inner + "\n" + listPad + indexHtml.slice(innerStart + closing.index),
);

// rss.xmlの生成
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// 日付をRSSのタイムスタンプに変換
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
writeText(JSON_PATH, JSON.stringify(blogsData, null, 4) + "\n");
writeText(LINKLIST_PATH, JSON.stringify(linksData, null, 4) + "\n");
console.log(
  `ブログ更新　いえい。（記事 ${txtFiles.length} 個、一覧 ${blogs.length} 個、RSS ${feedBlogs.length} 個、本文のないページ ${emptyTitles.size} 個）`,
);
