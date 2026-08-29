// L2 Human Understood

export function escapeAttr(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const collected = { images: [], links: [], articleLinks: [] };

// URLパスの判定機能
export function isAbsoluteUrl(src) {
  return src.startsWith("/") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(src);
}

// ブログタイトル判定機能
export function isLinkTarget(text) {
  return (
    isAbsoluteUrl(text) ||
    text.startsWith("./") ||
    text.startsWith("../") ||
    /\.html?([#?]|$)/.test(text)
  );
}

// [ラベル タイトル]を分ける機能。
export function splitLabel(text, titles) {
  if (titles.has(text)) return ["", text];
  for (const m of text.matchAll(/\s+/g)) {
    const node = text.slice(m.index + m[0].length);
    if (titles.has(node)) return [text.slice(0, m.index), node];
  }
  return ["", text];
}

// []を抜き出す機能
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

// []の記法を判定する。
export function markdown(content, topLevel = true) {
  const 囲み文字 = {
    "s": "小さい文字",
    ">": "引用",
    "c": "コメント文字",
    "(": "囲い文字",
  };

  const inner = content.slice(2).trim();

  // [i 画像ファイル名] または [ithum 画像ファイル名]
  const 画像記法 = content.match(/^(i|ithum)\s+(.+)$/s);
  if (画像記法) {
    const imgFile = 画像記法[2].trim();
    const src = isAbsoluteUrl(imgFile) ? imgFile : `blog_img/${imgFile}`;
    const thumb = 画像記法[1] === "ithum";
    collected.images.push({ src, thumb });
    return `<img alt="" class="ブログの画像${thumb ? " サムネイル" : ""}" src="${escapeAttr(src)}">`;
  }

  // [l 文字]で下線。[l1 文字]と[t1 文字]は同じ番号どうしを線で結ぶよ
  const lineMark = content.match(/^(l\d*|t\d+)\s+(.+)$/s);
  if (lineMark) {
    const cls = lineMark[1][0] === "l" ? "下線" : "線の先";
    const number = lineMark[1].slice(1);
    return `<span class="${cls}"${number ? ` data-線="${number}"` : ""}>${processInline(lineMark[2], false)}</span>`;
  }

  const deco = 囲み文字[content[0]];
  if (deco && content[1] === " ") {
    return `<span class="${deco}">${processInline(inner, false)}</span>`;
  }

  //カーソルを合わせると注釈が出るやつ [ {}]
  let m;
  if ((m = content.match(/^(.+?)\s+\{(.+)\}\n?$/s))) {
    const クリック = processInline(m[1], false);
    const 注釈 = processInline(m[2], false);
    return `<span class="カーソルを"><span>${クリック}</span><span>${注釈}</span></span>`;
  }

  if ((m = content.match(/^(.+?)\s+(\S+)\n?$/s)) && isLinkTarget(m[2])) {
    collected.links.push(m[2]);
    return `<a class="外部リンク" href="${m[2]}">${processInline(m[1], false)}</a>`;
  }

  const url = content.trim();

  // [タイトル]で記事へのリンク。build.mjsへ
  if (!isLinkTarget(url)) {
    collected.links.push(url);
    return `<a class="記事リンク" data-記事="${collected.articleLinks.push(url) - 1}">${url}</a>`;
  }

  //埋め込みとそうじゃないリンク [http 文字]
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

  collected.links.push(url);
  return `<a class="外部リンク" href="${url}">${url}</a>`;
}

// 記事生成。でかい。
export function txt2html(text) {
  collected.images.length = 0;
  collected.links.length = 0;
  collected.articleLinks.length = 0;

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

  // 箇条書きを閉じる
  function closeBullets(minDepth) {
    while (bulletStack.length && bulletStack[bulletStack.length - 1].depth >= minDepth) {
      const frame = bulletStack.pop();
      const html = `<li>${frame.text}${frame.children.length ? `<ul>${frame.children.join("")}</ul>` : ""}</li>`;
      if (bulletStack.length) bulletStack[bulletStack.length - 1].children.push(html);
      else bulletRoots.push(html);
    }
  }

  // 溜めてある段落・箇条書き・テーブルを閉じる
  function close(keep) {
    if (keep !== "paragraph" && paragraphBuf.length) {
      const html = processInline(paragraphBuf.join("\n"))
        .replace(/\r\n|\r|\n/g, "<br>\n")
        .replace(/(<img[^>]*>)<br>\n/g, "$1\n");

      const 開始タグ = /<(blockquote|figure|table|pre|div|ul|ol|h1|h2|h3|h4|h5|h6|p)(?=[\s/>])/i;
      const parts = [];
      let rest = html;
      let m;
      while ((m = rest.match(開始タグ)) !== null) {
        const タグたち = rest.slice(m.index).matchAll(new RegExp(`<${m[1]}(?=[\\s/>])|</${m[1]}\\s*>`, "gi"));
        let depth = 0;
        const 閉じ = [...タグたち].find((t) => (depth += t[0][1] === "/" ? -1 : 1) === 0);
        let end = 閉じ ? m.index + 閉じ.index + 閉じ[0].length : rest.length;
        const trailingScript = rest.slice(end).match(/^<script\b[^>]*><\/script>/);
        if (trailingScript) end += trailingScript[0].length;
        parts.push({ text: rest.slice(0, m.index) }, { block: rest.slice(m.index, end) });
        rest = rest.slice(end);
      }
      parts.push({ text: rest });

      for (const part of parts) {
        if (part.block !== undefined) {
          blocks.push(part.block);
          continue;
        }
        const text = part.text.replace(/^(?:\s|<br>)+/, "").replace(/(?:\s|<br>)+$/, "");
        if (text !== "") blocks.push(`<p>${text}</p>`);
      }
      paragraphBuf = [];
    }

    if (keep !== "bullets") {
      closeBullets(0);
      if (bulletRoots.length) {
        blocks.push(`<ul>${bulletRoots.join("")}</ul>`);
        bulletRoots.length = 0;
      }
    }

    if (keep !== "table" && tableBuf.length) {
      let thead = "";
      let tbody = "";
      for (const [isHeader, cells] of tableBuf) {
        if (isHeader) thead += `<thead><tr>${cells.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
        else tbody += `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      }
      blocks.push(`<table>${thead}<tbody>${tbody}</tbody></table>`);
      tableBuf.length = 0;
    }
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

  // この記事に出てきた画像とリンク。
  return {
    title,
    authorId,
    bodyHtml,
    images: [...collected.images],
    links: [...new Set(collected.links)],
    articleLinks: [...collected.articleLinks],
  };
}

export function renderArticleBody({ title, authorId, bodyHtml }) {
  const authorHtml = authorId ? `<div class="作った人たち">${authorId}</div>\n` : "";
  return `<h1>${title}</h1>\n${authorHtml}${bodyHtml}`;
}

export function renderPreview(text) {
  return renderArticleBody(txt2html(text));
}
