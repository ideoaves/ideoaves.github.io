// L2 Human Understood
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = import.meta.dirname;
const BLOG_DIR = path.join(ROOT, "blog");
const templatesDir = path.join(ROOT, "_includes");
const JSON_PATH = path.join(BLOG_DIR, "bloglist.json");

const SITE = "https://ideoaves.github.io";
const BLOG_URL = `${SITE}/blog/`;
const BLOG_TITLE = "Ideoaves のブログ";
const UNTITLED = /^(無題のファイル|Untitled)( \d+)?\.md$/;

// parser.mjsを読み直す
let txt2html, renderArticleBody, escapeAttr, isAbsoluteUrl;
async function loadParser() {
    const url = pathToFileURL(path.join(ROOT, "parser.mjs")).href;
    ({ txt2html, renderArticleBody, escapeAttr, isAbsoluteUrl } = await import(`${url}?${Date.now()}`));
}

// CRLFとLF変換たちの装置
function readText(file) {
    return fs.readFileSync(file, "utf-8").replace(/\r\n|\r/g, "\n");
}
function writeText(file, text) {
    fs.writeFileSync(file, text.replace(/\r\n|\r|\n/g, "\r\n"), "utf-8");
}
// テンプレ読み込み装置
function template(name) {
    return readText(path.join(templatesDir, name));
}
// 行頭の字下げ装置
function indentAt(text, at) {
    const lineStart = text.lastIndexOf("\n", at) + 1;
    const indent = text.slice(lineStart, at);
    return /^[ \t]*$/.test(indent) ? indent : "";
}

// templateのプレースホルダをその行の字下げに合わせてvalueで置き換える
function fillSlot(template, placeholder, value) {
    const at = template.indexOf(placeholder);
    if (at === -1) return template;
    const pad = indentAt(template, at);
    if (value === "") return template.split(`${pad}${placeholder}\n`).join("").split(placeholder).join("");
    const indented = value
        .split("\n")
        .map((line, i) => (i === 0 || line.trim() === "" ? line : pad + line))
        .join("\n");
    return template.split(placeholder).join(indented);
}

// md冒頭の設定読み
function readFrontMatter(text) {
    if (!text.startsWith("---\n")) return [{}, text];
    const end = text.indexOf("\n---\n", 4);
    if (end === -1) return [{}, text];
    const data = {};
    const lines = text.slice(4, end).split("\n");
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^([^:\s][^:]*):\s*(.*)$/);
        if (!m) continue;
        const key = m[1].trim();
        let value = m[2].trim();
        if (/^\|[-+]?$/.test(value)) {
            const buf = [];
            while (i + 1 < lines.length && (lines[i + 1].startsWith("  ") || lines[i + 1].trim() === "")) {
                buf.push(lines[++i].slice(2));
            }
            data[key] = buf.join("\n").replace(/\s+$/, "");
            continue;
        }
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        data[key] =
            value === "true" ? true : value === "false" ? false : /^\d+$/.test(value) ? Number(value) : value;
    }
    return [data, text.slice(end + 5)];
}

// 日付:の自動補完
function stampDate(file, raw) {
    const stat = fs.statSync(file);
    const created = new Date((stat.birthtimeMs || stat.mtimeMs) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const line = `日付: "${created}"\n`;
    const end = raw.startsWith("---\n") ? raw.indexOf("\n---\n", 4) : -1;
    if (end === -1) return `---\n${line}---\n\n${raw}`;
    const head = raw.slice(4, end + 1);
    const filled = /^日付:.*\n/m.test(head) ? head.replace(/^日付:.*\n/m, line) : line + head;
    return raw.slice(0, 4) + filled + raw.slice(end + 1);
}

// [ithum ] OR 最初の画像をサムネとする
function coverImage(images) {
    return (images.find((img) => img.thumb) ?? images[0])?.src ?? "";
}

// 冒頭n文字ぶんのサマリー
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

// 日付をRSSのタイムスタンプに変換
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function rfc822(dateStr) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${WEEKDAYS[d.getUTCDay()]}, ${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 +0900`;
}

// frameに対する流し込み
function renderPage(inner, meta) {
    let html = template("frame.html");
    html = fillSlot(html, "<ページの中身>", inner.trim());
    html = fillSlot(html, "<タイトル>", meta.title ? escapeAttr(meta.title) + " " : "");
    html = fillSlot(html, "<説明>", escapeAttr(meta.description ?? ""));
    html = fillSlot(html, "<SNSのタイトル>", escapeAttr(meta.title || "Ideoaves"));
    html = fillSlot(html, "<画像>", escapeAttr(meta.image ?? `${SITE}/img/icon.png`));
    html = fillSlot(html, "<ロゴclass>", meta.bigLogo ? "大きな ロゴ" : "ロゴ");
    html = fillSlot(html, "<headの追加>", meta.head ?? "");
    html = fillSlot(
        html,
        "<RSS用>",
        meta.rss ? `<link rel="alternate" type="application/rss+xml" title="${BLOG_TITLE}" href="/blog/rss.xml">` : "",
    );
    return html;
}

// 本体
export function build() {
    let blogsData = {};
    try {
        blogsData = JSON.parse(readText(JSON_PATH));
    } catch {
        blogsData = {};
    }

    // 記事を読んで日付などを足して保存
    const articles = fs
        .readdirSync(BLOG_DIR)
        .filter((name) => name.endsWith(".md") && !UNTITLED.test(name))
        .map((filename) => {
            const file = path.join(BLOG_DIR, filename);
            let raw = readText(file);
            if (!readFrontMatter(raw)[0]["日付"]) {
                raw = stampDate(file, raw);
                writeText(file, raw);
                console.log(`  ${filename}: 日付を書き足し`);
            }
            const [data, content] = readFrontMatter(raw);
            if (data.hide) return null;
            const config = [];
            if (data.id) config.push(`id=${data.id}`);
            if (data.mokuzi !== undefined) config.push(`mokuzi=${data.mokuzi}`);
            return {
                filename,
                title: filename.slice(0, -3),
                date: String(data["日付"] ?? ""),
                text: config.map((line) => line + "\n").join("") + content.trim(),
            };
        })
        .filter(Boolean);

    // 日付の順に
    articles.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // 名前決めと固定
    function nextName(date, used, n = 1) {
        const name = n === 1 ? `${date}.html` : `${date}-${String(n).padStart(2, "0")}.html`;
        return used.has(name) ? nextName(date, used, n + 1) : name;
    }
    const previousNames = new Map(Object.values(blogsData).map((b) => [b.date, b.filename]));
    const usedNames = new Set();
    for (const a of articles) {
        const name = previousNames.get(a.date) ?? nextName(a.date, usedNames);
        a.outputFilename = name;
        usedNames.add(name);
    }
    for (const a of articles) a.parsed = txt2html(a.text, false);

    // json更新
    const list = {};
    for (const a of articles) {
        list[a.outputFilename] = {
            filename: a.outputFilename,
            md: a.filename,
            title: a.title,
            img: coverImage(a.parsed.images),
            summary: summarize(a.parsed.bodyHtml, 100),
            date: a.date,
            author: a.parsed.authorId,
            links: a.parsed.links,
        };
    }

    // link.htmlのhrefを作る
    const titleToFile = new Map(Object.values(list).map((b) => [b.title, b.filename]));
    function nodeAnchor(node) {
        const file = titleToFile.get(node);
        const href = file
            ? file.replace(/[%#?\s]/g, (c) => encodeURIComponent(c))
            : `link.html?t=${encodeURIComponent(node)}`;
        return `<a class="${file ? "記事リンク" : "記事リンク 空リンク"}" href="${escapeAttr(href)}">`;
    }

    // 記事ページ
    for (const a of articles) {
        const bodyHtml = a.parsed.bodyHtml.replace(
            /<a class="記事リンク" data-記事="([^"]*)">/g,
            (whole, node) => nodeAnchor(node.replaceAll("&amp;", "&")),
        );
        const cover = coverImage(a.parsed.images);
        const inner = fillSlot(
            fillSlot(template("blogframe.html").trimEnd(), "<ブログの中身>", renderArticleBody({ ...a.parsed, title: a.title, bodyHtml })),
            "<記事のタイトル>",
            escapeAttr(a.title),
        );
        writeText(
            path.join(BLOG_DIR, a.outputFilename),
            renderPage(inner, {
                title: a.title,
                description: summarize(bodyHtml, 20),
                image: isAbsoluteUrl(cover) ? cover : `${BLOG_URL}${cover}`,
                rss: true,
            }),
        );
    }

    // 本文のないページ。
    writeText(
        path.join(BLOG_DIR, "link.html"),
        renderPage(fillSlot(template("linkframe.html").trimEnd(), "<ブログの中身>", '<h1 class="リンクのタイトル"></h1>'), {
            title: "リンク",
            description: "リンクページ",
            rss: true,
        }),
    );

    // 新しい順の一覧とRSS。未来の日付はRSSに出さない, 並びが壊れて購読側に迷惑をかけるため。
    const sorted = Object.values(list).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const cards = sorted
        .map((b) => {
            const authors = b.author
                .split(/\s+/)
                .filter(Boolean)
                .map((author) => `${author}の記事`)
                .join(" ");
            let card = template("ブログのカード.html").trimEnd();
            card = fillSlot(card, "<カードclass>", escapeAttr(authors ? `ブログ ${authors}` : "ブログ"));
            card = fillSlot(card, "<ブログURL>", escapeAttr(b.filename));
            card = fillSlot(card, "<サムネイル>", b.img ? `<img alt="" src="${escapeAttr(b.img)}">` : "");
            card = fillSlot(card, "<タイトル>", b.title);
            card = fillSlot(card, "<日付>", b.date);
            card = fillSlot(card, "<サマリー>", b.img ? "" : `<div class="ブログの最初">${b.summary}<br></div>`);
            return card;
        })
        .join("\n");
    writeText(
        path.join(BLOG_DIR, "index.html"),
        renderPage(fillSlot(template("ブログの一覧.html").trimEnd(), "<記事カード>", cards), {
            title: "blogs",
            description: "Ideoavesのブログ",
            rss: true,
        }),
    );
    const feed = sorted.filter((b) => b.date <= todayJST);
    const items = feed
        .map((b) => {
            let item = template("rssの記事.html").trimEnd();
            item = fillSlot(item, "<タイトル>", escapeXml(b.title));
            item = fillSlot(item, "<URL>", escapeXml(`${BLOG_URL}${b.filename}`));
            item = fillSlot(item, "<日付>", rfc822(b.date));
            item = fillSlot(item, "<参加者>", b.author ? `<dc:creator>${escapeXml(b.author)}</dc:creator>` : "");
            item = fillSlot(item, "<サマリー>", escapeXml(b.summary));
            return item;
        })
        .join("\n");
    let rss = fillSlot(template("rss.xml"), "<記事たち>", items);
    rss = fillSlot(rss, "<最終更新>", feed.length ? rfc822(feed[0].date) : "");
    writeText(path.join(BLOG_DIR, "rss.xml"), rss);

    writeText(JSON_PATH, JSON.stringify(list, null, 4) + "\n");

    // ファイル名をURLに。フォルダの中のmdも同じ場所
    function findPages(dir = "") {
        return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
            const rel = path.join(dir, entry.name);
            if (entry.isDirectory()) return entry.name.startsWith(".") || rel === "blog" ? [] : findPages(rel);
            const skip = entry.name === "README.md" || UNTITLED.test(entry.name);
            return entry.name.endsWith(".md") && !skip ? [rel] : [];
        });
    }
    const pages = findPages()
        .map((rel) => [rel, ...readFrontMatter(readText(path.join(ROOT, rel)))])
        .filter(([, meta]) => !meta.hide);
    for (const [rel, meta, content] of pages) {
        writeText(
            path.join(ROOT, rel.slice(0, -3) + ".html"),
            renderPage(txt2html("mokuzi=0\n" + content, false).bodyHtml, { ...meta, rss: false }),
        );
    }

    console.log(
        `更新、いえい。（記事 ${articles.length} 本、ページ ${pages.length} 枚、RSS ${feed.length} 件）`,
    );
}

// ファイル監視　起動しておけば実質リアルタイム更新。
function watch() {
    let timer = null;
    const rebuild = () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            try {
                await loadParser();
                build();
            } catch (e) {
                console.error(e.message);
            }
        }, 120);
    };
    for (const [dir, watchExt, recursive] of [
        [ROOT, /\.md$|^parser\.mjs$/, true],
        [templatesDir, /\.(html|xml)$/, false],
    ]) {
        fs.watch(dir, { recursive }, (event, name) => {
            if (name && watchExt.test(name)) rebuild();
        });
    }
    console.log("更新中");
}

await loadParser();
build();
if (process.argv.includes("--watch")) watch();
