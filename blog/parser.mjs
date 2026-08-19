const 無題 = "( U̴̺͎͙̔͆̔n̴͙̦̟͛̾͝t̸̼̘̺͑̽̽i̸̝͖̻͋̿͊t̴͉͎̟͊͒̕l̸̝̞͒̕̕è̴͉̫̫̒̓d̴̙͎̟̓͝͝ )";

const ツイート埋め込み =
  '<script async src="https://platform.twitter.com/widgets.js"></script>';

// 見出しのテキストから目次用のアンカー文字列を作るよ
export function anchorize(title) {
  return title.replace(/[^\p{L}\p{N}_]+/gu, "-");
}

// https://... や //... 、/... で始まるものは、blog_img/ の中ではなく外を指しているとみなすよ。
export function isAbsoluteUrl(src) {
  return src.startsWith("/") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(src);
}

// 属性値に入れる文字列をエスケープするよ。
export function escapeAttr(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// escapeAttrの逆で、属性値から元の文字列を復元するよ。&amp;を最後に戻すのが大事だよ。
export function unescapeAttr(text) {
  return String(text)
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

// インライン構文をHTMLに変換するよ。
export function processInline(text, topLevel = true) {
  let result = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] === "[") {
      let depth = 1;
      let j = i + 1;
      while (j < n && depth > 0) {
        if (text[j] === "[") depth++;
        else if (text[j] === "]") depth--;
        j++;
      }
      if (depth === 0) {
        result += convertBracket(text.slice(i + 1, j - 1), topLevel);
        i = j;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

// topLevelは、この[...]が本文に直接書かれたもの（true）か、他の[...]構文の中にネストしたもの（false）かを表すよ。
// YouTube/Twitterの埋め込みは、注釈や引用などにネストした状態だとうまく表示できないため、トップレベルのときだけ行う。
export function convertBracket(content, topLevel = true) {
  if (content.startsWith("i ")) {
    const filename = content.slice(2).trim();
    // 絶対URLならそのまま、ファイル名だけならblog_img/の中を指すよ。
    const src = isAbsoluteUrl(filename) ? filename : `blog_img/${filename}`;
    return `<img alt="" class="ブログの画像" src="${escapeAttr(src)}">`;
  }

  if (content.startsWith("s ")) {
    return `<span class="小さい文字">${processInline(content.slice(2).trim(), false)}</span>`;
  }

  if (content.startsWith("> ")) {
    return `<span class="引用">${processInline(content.slice(2).trim(), false)}</span>`;
  }

  if (content.startsWith("c ")) {
    return `<span class="コメント文字">${processInline(content.slice(2).trim(), false)}</span>`;
  }

  if (content.startsWith("( ")) {
    return `<span class="囲い文字">${processInline(content.slice(2).trim(), false)}</span>`;
  }

  const cursorM = content.match(/^(.+?)\s+\{(.+)\}\n?$/s);
  if (cursorM) {
    const textA = processInline(cursorM[1], false);
    const textB = processInline(cursorM[2], false);
    return `<span class="カーソルを"><span>${textA}</span><span>${textB}</span></span>`;
  }

  const linkM = content.match(/^(.+?)\s+(\S+)\n?$/s);
  if (linkM) {
    return `<a href="${linkM[2]}">${processInline(linkM[1], false)}</a>`;
  }

  // ここまでで判定できなければ、中身は単独の [URL] として扱うよ。
  const url = content.trim();

  if (topLevel) {
    const tweetM = url.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/);
    if (tweetM) {
      return (
        `<blockquote class="twitter-tweet"><a href="https://twitter.com/${tweetM[1]}/status/${tweetM[2]}"></a></blockquote>` +
        ツイート埋め込み
      );
    }

    const ytM = url.match(/^(?:https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([^&\s?]+)/);
    if (ytM) {
      return `<iframe src="https://www.youtube.com/embed/${ytM[1]}" allow="picture-in-picture" allowfullscreen></iframe>`;
    }
  }

  return `<a href="${url}">${url}</a>`;
}

// 記事テキスト1本を解析して、本文HTMLと付随情報を返すよ。
export function parseArticle(text) {
  // Pythonのstrip()+splitlines()に合わせて、空文字のときは行なしとして扱うよ。
  const trimmed = text.trim();
  const fileLines = trimmed === "" ? [] : trimmed.split(/\r\n|\r|\n/);
  const title = fileLines.length ? fileLines[0].trim() : 無題;
  const restLines = fileLines.slice(1);

  let authorId = "";
  let bodyLines;
  if (restLines.length && restLines[0].trim().startsWith("id=")) {
    authorId = restLines[0].trim().slice(3).trim();
    bodyLines = restLines.slice(1);
  } else {
    bodyLines = restLines;
  }

  // 本文を段落・見出し・箇条書き・テーブルのブロックに分解し、それぞれHTMLに変換していくよ。
  const blocks = [];
  const toc = [];
  let paragraphBuf = [];
  const bulletStack = []; // 箇条書きのネストを深さで管理するスタック。各フレームは<li>1個分。
  const bulletRoots = []; // 現在の箇条書きの並びで、親を持たないトップレベルの<li>を集めるよ。
  const tableBuf = []; // テーブル行を集めるよ。各要素は [isHeader, cells]。

  function closeParagraph() {
    if (paragraphBuf.length) {
      let processed = processInline(paragraphBuf.join("\n"));
      processed = processed.replace(/\r\n|\r|\n/g, "<br>\n");
      // 画像やTwitter埋め込みはCSS/HTMLの既定でブロック要素になり、それ自体が改行を作るため、
      // 直後の<br>は二重改行になってしまうよ。
      processed = processed.replace(
        /(<img[^>]*>|<script async src="https:\/\/platform\.twitter\.com\/widgets\.js"><\/script>)<br>\n/g,
        "$1\n",
      );
      blocks.push(`<p>${processed}</p>`);
      paragraphBuf = [];
    }
  }

  function closeBullets(minDepth) {
    // 深さがminDepth以上のフレームを閉じて<li>にし、親フレーム（なければbulletRoots）に積んでいくよ。
    while (bulletStack.length && bulletStack[bulletStack.length - 1].depth >= minDepth) {
      const frame = bulletStack.pop();
      const childrenHtml = frame.children.length ? `<ul>${frame.children.join("")}</ul>` : "";
      const liHtml = `<li>${frame.text}${childrenHtml}</li>`;
      if (bulletStack.length) {
        bulletStack[bulletStack.length - 1].children.push(liHtml);
      } else {
        bulletRoots.push(liHtml);
      }
    }
  }

  function endBulletRun() {
    // 集まったトップレベルの<li>たちを1つの<ul>にまとめてblocksへ追加するよ。
    closeBullets(0);
    if (bulletRoots.length) {
      blocks.push(`<ul>${bulletRoots.join("")}</ul>`);
      bulletRoots.length = 0;
    }
  }

  function closeTable() {
    // テーブル行の並びが終わったときに呼ぶ。||で始まる行だけheadにし、それ以外はtbodyに積むよ。
    if (tableBuf.length) {
      let theadHtml = "";
      let tbodyHtml = "";
      for (const [isHeader, cells] of tableBuf) {
        if (isHeader) {
          theadHtml += `<thead><tr>${cells.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
        } else {
          tbodyHtml += `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
        }
      }
      blocks.push(`<table>${theadHtml}<tbody>${tbodyHtml}</tbody></table>`);
      tableBuf.length = 0;
    }
  }

  for (const line of bodyLines) {
    if (line.trim() === "") {
      closeParagraph();
      endBulletRun();
      closeTable();
      continue;
    }

    const headingM = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingM) {
      closeParagraph();
      endBulletRun();
      closeTable();
      const level = headingM[1].length;
      const headingTitle = headingM[2].trim();
      const anchor = anchorize(headingTitle);
      if (level <= 2) {
        // h1とh2のみを目次に追加するよ。
        toc.push([level, headingTitle, anchor]);
      }
      blocks.push(`<h${level} id="${anchor}">${processInline(headingTitle)}</h${level}>`);
      continue;
    }

    const bulletM = line.match(/^(\s+)(\S.*)$/);
    if (bulletM) {
      closeParagraph();
      closeTable();
      const depth = bulletM[1].length;
      closeBullets(depth);
      bulletStack.push({
        depth,
        text: processInline(bulletM[2].trim()),
        children: [],
      });
      continue;
    }

    // テーブル行構文 |セル1  セル2  セル3 （セルは空白2つかタブで区切るよ）。||で始まる行はheadになる。
    const tableM = line.match(/^\|(\|?)(.*)$/);
    if (tableM) {
      closeParagraph();
      endBulletRun();
      const isHeader = tableM[1] === "|";
      const cells = tableM[2].split(/\t| {2,}/).map((cell) => processInline(cell.trim()));
      tableBuf.push([isHeader, cells]);
      continue;
    }

    endBulletRun();
    closeTable();
    paragraphBuf.push(line);
  }

  closeParagraph();
  endBulletRun();
  closeTable();

  // 見出しが3件より多く集まったら、記事の先頭に目次ブロックを挿入するよ。
  if (toc.length > 3) {
    let tocHtml = '<div class="目次"><h4>目次</h4>';
    for (const [level, tocTitle, anchor] of toc) {
      const cls = level === 2 ? ' class="h2"' : "";
      tocHtml += `<a href="#${anchor}"${cls}>${tocTitle}</a><br>`;
    }
    tocHtml += "</div>";
    blocks.unshift(tocHtml);
  }

  const bodyHtml = blocks.join("\n");

  // 記事内で最初に見つかった画像をサムネイル用に取得するよ。
  const imgMatch = bodyHtml.match(/<img[^>]+src="([^"]+)"/);
  // src属性はエスケープ済みなので、URLとして使えるよう元に戻しておくよ。
  const firstImg = imgMatch ? unescapeAttr(imgMatch[1]) : "";

  // HTMLタグなどを取り除いて、記事一覧ページに表示する要約文を生成するよ。
  let summaryText = bodyHtml.replace(/<div class="目次">.*?<\/div>/gs, "");
  summaryText = summaryText.replace(
    /<span class="カーソルを"[^>]*><span>(.*?)<\/span>.*?<\/span>/gs,
    "$1",
  );
  summaryText = summaryText.replace(/<[^>]+>/g, "").trim();
  summaryText = summaryText.replace(/\s+/g, " ");

  return {
    title,
    authorId,
    bodyHtml,
    toc,
    firstImg,
    summaryText,
    summary20: summaryText.length > 20 ? summaryText.slice(0, 20) + "..." : summaryText,
    summary100: summaryText.length > 100 ? summaryText.slice(0, 100) + "..." : summaryText,
  };
}

// 記事本文の見た目部分（h1・著者・本文）を組み立てるよ。ページ全体のテンプレート流し込みはbuild.mjsの仕事。
export function renderArticleBody({ title, authorId, bodyHtml }) {
  const authorHtml = authorId ? `<div class="作った人たち">${authorId}</div>\n` : "";
  return `<h1>${title}</h1>\n${authorHtml}${bodyHtml}`;
}

// テキストから表示用HTML断片まで一気に作るショトカ。
export function renderPreview(text) {
  return renderArticleBody(parseArticle(text));
}
