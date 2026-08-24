export function escapeAttr(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function isAbsoluteUrl(src) {
  return src.startsWith("/") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(src);
}

function splitBlocks(html) {
  const ブロック要素 = "blockquote|figure|table|pre|div|ul|ol|h1|h2|h3|h4|h5|h6|p";
  const 開始タグ = new RegExp(`<(${ブロック要素})(?=[\\s/>])`, "i");
  const parts = [];
  let rest = html;
  let m;
  while ((m = rest.match(開始タグ)) !== null) {
    const tagRe = new RegExp(`<${m[1]}(?=[\\s/>])|</${m[1]}\\s*>`, "gi");
    tagRe.lastIndex = m.index;
    let depth = 0;
    let end = rest.length;
    for (const t of rest.matchAll(tagRe)) {
      depth += t[0][1] === "/" ? -1 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    const trailingScript = rest.slice(end).match(/^<script\b[^>]*><\/script>/);
    if (trailingScript) end += trailingScript[0].length;
    parts.push({ text: rest.slice(0, m.index) }, { block: rest.slice(m.index, end) });
    rest = rest.slice(end);
  }
  parts.push({ text: rest });
  return parts;
}

export function processInline(text, topLevel = true) {
  const at = text.indexOf("[");
  if (at === -1) return text;

  let depth = 1;
  let end = at + 1;
  for (; end < text.length && depth > 0; end++) {
    if (text[end] === "[") depth++;
    else if (text[end] === "]") depth--;
  }
  if (depth > 0) return text.slice(0, at + 1) + processInline(text.slice(at + 1), topLevel);

  return (
    text.slice(0, at) +
    markdown(text.slice(at + 1, end - 1), topLevel) +
    processInline(text.slice(end), topLevel)
  );
}

export function markdown(content, topLevel = true) {
  const 囲み文字 = {
    "s": "小さい文字",
    ">": "引用",
    "c": "コメント文字",
    "(": "囲い文字",
  };

  const inner = content.slice(2).trim();

  if (content.startsWith("i ")) {
    const src = isAbsoluteUrl(inner) ? inner : `blog_img/${inner}`;
    return `<img alt="" class="ブログの画像" src="${escapeAttr(src)}">`;
  }

  const deco = 囲み文字[content[0]];
  if (deco && content[1] === " ") {
    return `<span class="${deco}">${processInline(inner, false)}</span>`;
  }

  let m;
  if ((m = content.match(/^(.+?)\s+\{(.+)\}\n?$/s))) {
    const クリック = processInline(m[1], false);
    const 注釈 = processInline(m[2], false);
    return `<span class="カーソルを"><span>${クリック}</span><span>${注釈}</span></span>`;
  }

  if ((m = content.match(/^(.+?)\s+(\S+)\n?$/s))) {
    return `<a href="${m[2]}">${processInline(m[1], false)}</a>`;
  }

  const url = content.trim();

  if (topLevel) {
    if ((m = url.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/))) {
      return (
        `<blockquote class="twitter-tweet"><a href="https://twitter.com/${m[1]}/status/${m[2]}"></a></blockquote>` +
        '<script async src="https://platform.twitter.com/widgets.js"></script>'
      );
    }

    if ((m = url.match(/^(?:https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([^&\s?]+)/))) {
      return `<iframe src="https://www.youtube.com/embed/${m[1]}" allow="picture-in-picture" allowfullscreen></iframe>`;
    }
  }

  return `<a href="${url}">${url}</a>`;
}

export function txt2html(text) {
  const trimmed = text.trim();
  const 行 = trimmed === "" ? [] : trimmed.split(/\r\n|\r|\n/);
  const title = 行.length ? 行[0].trim() : "無題";

  // 設定行。
  const config = { id: "", mokuzi: "2" };
  let i = 1;
  for (; i < 行.length; i++) {
    const m = 行[i].trim().match(/^(id|mokuzi)=(.*)$/);
    if (!m) break;
    config[m[1]] = m[2].trim();
  }
  const authorId = config.id;
  const [mokuziDepth, ...mokuziFlags] = config.mokuzi.split(/\s+/);
  const tocDepth = Number(mokuziDepth) || 0;
  const tocHorizontal = mokuziFlags.includes("long");

  const blocks = [];
  const toc = [];
  const usedAnchors = new Set();
  let paragraphBuf = [];
  const bulletStack = [];
  const bulletRoots = [];
  const tableBuf = [];

  function closeParagraph() {
    if (!paragraphBuf.length) return;
    const html = processInline(paragraphBuf.join("\n"))
      .replace(/\r\n|\r|\n/g, "<br>\n")
      .replace(/(<img[^>]*>)<br>\n/g, "$1\n");

    for (const part of splitBlocks(html)) {
      if (part.block !== undefined) {
        blocks.push(part.block);
        continue;
      }
      const text = part.text.replace(/^(?:\s|<br>)+/, "").replace(/(?:\s|<br>)+$/, "");
      if (text !== "") blocks.push(`<p>${text}</p>`);
    }
    paragraphBuf = [];
  }

  function closeBullets(minDepth) {
    while (bulletStack.length && bulletStack[bulletStack.length - 1].depth >= minDepth) {
      const frame = bulletStack.pop();
      const html = `<li>${frame.text}${frame.children.length ? `<ul>${frame.children.join("")}</ul>` : ""}</li>`;
      if (bulletStack.length) bulletStack[bulletStack.length - 1].children.push(html);
      else bulletRoots.push(html);
    }
  }

  function endBulletRun() {
    closeBullets(0);
    if (bulletRoots.length) {
      blocks.push(`<ul>${bulletRoots.join("")}</ul>`);
      bulletRoots.length = 0;
    }
  }

  function closeTable() {
    if (!tableBuf.length) return;
    let thead = "";
    let tbody = "";
    for (const [isHeader, cells] of tableBuf) {
      if (isHeader) thead += `<thead><tr>${cells.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
      else tbody += `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    }
    blocks.push(`<table>${thead}<tbody>${tbody}</tbody></table>`);
    tableBuf.length = 0;
  }

  function close(keep) {
    if (keep !== "paragraph") closeParagraph();
    if (keep !== "bullets") endBulletRun();
    if (keep !== "table") closeTable();
  }

  for (const line of 行.slice(i)) {
    if (line.trim() === "") {
      close();
      continue;
    }

    let m;
    if ((m = line.match(/^(#{1,3})\s+(.+)$/))) {
      close();
      const level = m[1].length;
      const 見出し = m[2].trim();
      const base = 見出し.replace(/[^\p{L}\p{N}_]+/gu, "-") || "見出し";
      let anchor = base;
      for (let n = 2; usedAnchors.has(anchor); n++) anchor = `${base}-${n}`;
      usedAnchors.add(anchor);

      toc.push([level, 見出し, anchor]);
      blocks.push(`<h${level} id="${anchor}">${processInline(見出し)}</h${level}>`);
      continue;
    }

    if ((m = line.match(/^(\s+)(\S.*)$/))) {
      close("bullets");
      const depth = m[1].length;
      closeBullets(depth);
      bulletStack.push({ depth, text: processInline(m[2].trim()), children: [] });
      continue;
    }

    if ((m = line.match(/^\|(\|?)(.*)$/))) {
      close("table");
      tableBuf.push([m[1] === "|", m[2].split(/\t| {2,}/).map((c) => processInline(c.trim()))]);
      continue;
    }

    close("paragraph");
    paragraphBuf.push(line);
  }

  close();

  // 目次
  const tocItems = toc.filter(([level]) => level <= tocDepth);
  const isHorizontal = (level) => tocHorizontal && level > 1;
  const 項目 = tocItems
    .map(([level, 見出し, anchor], n) => {
      const horizontal = isHorizontal(level);
      const classes = [horizontal ? "横向き目次" : "", level > 1 ? `h${level}` : ""].filter(Boolean);
      const attr = classes.length ? ` class="${classes.join(" ")}"` : "";
      const leadingBreak = !horizontal && n > 0 && isHorizontal(tocItems[n - 1][0]) ? "<br>" : "";
      return `${leadingBreak}<a href="#${anchor}"${attr}>${見出し}</a>${horizontal ? "" : "<br>"}`;
    })
    .join("");
  if (toc.filter(([level]) => level <= 2).length > 3 && 項目 !== "") {
    blocks.unshift(`<div class="目次"><h1>目次</h1>${項目}</div>`);
  }

  const bodyHtml = blocks.join("\n");

  // 最初の画像をサムネイル用に取得するよ。
  const 画像 = bodyHtml.match(/<img[^>]+src="([^"]+)"/);
  const firstImg = 画像
    ? 画像[1]
        .replaceAll("&quot;", '"')
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll("&amp;", "&")
    : "";

  // 要約文
  const summaryText = bodyHtml
    .replace(/<div class="目次">.*?<\/div>/gs, "")
    .replace(/<span class="カーソルを"[^>]*><span>(.*?)<\/span>.*?<\/span>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/\s+/g, " ");
  const 切り詰め = (n) => (summaryText.length > n ? summaryText.slice(0, n) + "..." : summaryText);

  return {
    title,
    authorId,
    bodyHtml,
    toc,
    firstImg,
    summaryText,
    summary20: 切り詰め(20),
    summary100: 切り詰め(100),
  };
}

export function renderArticleBody({ title, authorId, bodyHtml }) {
  const authorHtml = authorId ? `<div class="作った人たち">${authorId}</div>\n` : "";
  return `<h1>${title}</h1>\n${authorHtml}${bodyHtml}`;
}

export function renderPreview(text) {
  return renderArticleBody(txt2html(text));
}
