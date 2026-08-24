(async () => {
    // 無限キャンバスの調整。
    const margin = 80;
    const gap = 10;

    const scaleX = 1.1;
    const scaleY = 1;

    const minScale = 0.08;
    const maxScale = 3;
    const zoomSpeed = 0.0015;

    // 日付による縦方向の配置を有効にするかどうか。実装だけしたけど使わないな。
    const datePosition = false;
    // 恣意的に古い時代の時間を圧縮してます。
    const pivotYear = 2024;
    const pxPerYear = 1500;
    const pxPerYearOld = 0;

    const clamp = (v, low, high) => Math.min(Math.max(v, low), high);

    const viewport = document.querySelector('.nodeField');
    if (!viewport) return;

    const colorClass = { 1: '赤色', 2: '橙色', 3: '黄色', 4: '緑色', 5: '水色', 6: '紫色' };

    const escapeHtml = (s) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // [表題](url) と裸のURLを <a> にする
    function inlineMarkup(text) {
        return escapeHtml(text)
            .replace(
                /\[([^\]]*?)\]\((\S+?)\)/g,
                (_, label, url) =>
                    `<a href="${url}" target="_blank" rel="noopener">${label || url}</a>`
            )
            .split(/(<a .*?<\/a>)/)
            .map((part) => (part.startsWith('<a ') ? part : part.replace(
                /(https?:\/\/[^\s<]+)/g,
                '<a href="$1" target="_blank" rel="noopener">$1</a>'
            )))
            .join('');
    }

    // ![[名前]] の拡張子確認。動画と音声。
    function embedTag(name) {
        const src = 'img/' + name.replace(/ /g, '%20');
        if (/\.(webm|mp4|mov|ogv|m4v)$/i.test(name)) {
            return `<video src="${src}" autoplay loop muted playsinline></video>`;
        }
        if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(name)) {
            return `<audio src="${src}" controls></audio>`;
        }
        const alt = escapeHtml(name.replace(/\.[^.]*$/, '')).replace(/"/g, '&quot;');
        return `<img src="${src}" alt="${alt}" loading="lazy" draggable="false">`;
    }

    // 単独行のURLをYouTubeのサムネイルにする
    function youtubeTag(url) {
        const youtubeId =
            /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([\w-]{11})/;
        const id = youtubeId.exec(url)?.[1];
        const safe = escapeHtml(url).replace(/"/g, '&quot;');
        if (!id) {
            return `<p><a href="${safe}" target="_blank" rel="noopener">${safe}</a></p>`;
        }
        return '<div class="動画">'
            + `<img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="" `
            + 'loading="lazy" draggable="false"></div>';
    }

    // サムネイルを押したら埋め込みに差し替える
    function wireVideo(el) {
        for (const player of el.querySelectorAll('.動画')) {
            const thumb = player.querySelector('img');

            thumb.addEventListener('error', () => {
                if (thumb.src.includes('maxresdefault')) {
                    thumb.src = thumb.src.replace('maxresdefault', 'hqdefault');
                }
            });

            player.addEventListener('click', () => {
                if (dragged) return;
                const id = thumb.src.match(/\/vi\/([\w-]+)\//)[1];
                player.innerHTML =
                    `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" ` +
                    'title="YouTube" allowfullscreen allow="autoplay; ' +
                    'clipboard-write; encrypted-media; picture-in-picture">' +
                    '</iframe>';
            });
        }
    }

    // canvasのテキストをHTMLにする
    function textToHtml(text) {
        const out = [];
        let para = [];
        let date = null;
        const flush = () => {
            if (para.length) out.push('<p>' + para.join('<br>') + '</p>');
            para = [];
        };
        const flushDate = () => {
            if (date.length) out.push('<p class="日付">' + date.join('<br>') + '</p>');
        };

        for (const raw of text.split('\n')) {
            const line = raw.trim();

            if (line === '$$') {
                if (date === null) {
                    flush();
                    date = [];
                } else {
                    flushDate();
                    date = null;
                }
                continue;
            }
            if (date !== null) {
                if (line) date.push(inlineMarkup(line));
                continue;
            }
            if (!line) {
                flush();
                continue;
            }

            const embed = /^!\[\[(.+?)\]\]$/.exec(line);
            if (embed) {
                flush();
                out.push(embedTag(embed[1]));
                continue;
            }

            const head = /^(#{1,6})\s*(.*)$/.exec(line);
            if (head) {
                flush();
                const level = clamp(head[1].length, 2, 4);
                out.push(`<h${level}>${inlineMarkup(head[2])}</h${level}>`);
                continue;
            }

            if (/^https?:\/\/\S+$/.test(line) && !out.length && !para.length) {
                out.push(youtubeTag(line));
                continue;
            }

            para.push(inlineMarkup(line));
        }

        flush();
        if (date?.length) flushDate();
        return out.join('');
    }

    // .日付 の文字から縦位置を決める（datePositionがtrueのときだけです）
    function date2position(node) {
        if (!datePosition) return true;
        const parts = String(node.el.querySelector('.日付')?.textContent)
            .replace(/[年月]/g, '/')
            .replace(/日/g, '')
            .split('/')
            .map((v) => parseInt(v, 10))
            .filter((v) => !Number.isNaN(v));
        if (!parts.length) return false;
        const [y, m = 1, d = 1] = parts;
        const years = (new Date(y, m - 1, d) - new Date(pivotYear, 0, 1))
            / (365.2425 * 24 * 60 * 60 * 1000);
        node.y = -years * (years < 0 ? pxPerYearOld : pxPerYear);
        return true;
    }

    let canvasData;
    try {
        canvasData = await (await fetch('nodes.canvas')).json();
    } catch (err) {
        console.error(err);
        viewport.textContent = 'nodes.canvasが読めないです';
        return;
    }

    const source = canvasData.nodes.filter((n) => n.type === 'text');
    source.sort((a, b) => (a.x - b.x) || (a.y - b.y));

    const nodes = source.map((n) => {
        const el = document.createElement('div');
        el.className = 'ノード' + (colorClass[n.color] ? ' ' + colorClass[n.color] : '');
        el.id = n.id;
        el.innerHTML = textToHtml(n.text || '');
        wireVideo(el);
        return { el, x: n.x, y: n.y };
    });

    const ids = new Set(source.map((n) => n.id));
    const edges = canvasData.edges
        .filter((e) => ids.has(e.fromNode) && ids.has(e.toNode))
        .map((e) => ({
            from: e.fromNode,
            fromSide: e.fromSide || 'bottom',
            to: e.toNode,
            toSide: e.toSide || 'top',
            label: (e.label || '').trim(),
        }));

    // 日付の読めなかったノードを一番下に揃える
    const dated = nodes.filter(date2position);
    if (dated.length) {
        const bottom = Math.max(...dated.map((n) => n.y));
        for (const node of nodes) if (!dated.includes(node)) node.y = bottom;
    }
    nodes.sort((a, b) => a.y - b.y);

    // div だけHTML、他はSVGとして作って親に挿す
    const create = (tag, attrs = {}, parent) => {
        const el = document.createElementNS(
            tag === 'div' ? 'http://www.w3.org/1999/xhtml' : 'http://www.w3.org/2000/svg',
            tag
        );
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        parent.appendChild(el);
        return el;
    };

    const canvas = document.createElement('div');
    canvas.className = 'キャンバス';
    viewport.prepend(canvas);

    const svg = create('svg', { class: 'エッジ層' }, canvas);
    svg.innerHTML =
        '<defs><marker id="矢" viewBox="0 0 10 10" refX="9" refY="5" ' +
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>';
    nodes.forEach(({ el }) => canvas.appendChild(el));

    let totalWidth = 0;
    let totalHeight = 0;

    // canvas座標に並べる。軽い衝突防止も。
    function layout() {
        const minX = Math.min(...nodes.map((n) => n.x));
        const minY = Math.min(...nodes.map((n) => n.y));
        const placed = [];
        for (const { el, x, y } of nodes) {
            const left = (x - minX) * scaleX + margin;
            const top = placed.reduce(
                (t, done) => (Math.abs(done.left - left) < el.offsetWidth
                    ? Math.max(t, done.bottom + gap) : t),
                (y - minY) * scaleY + margin
            );
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            placed.push({ left, bottom: top + el.offsetHeight });
        }

        totalWidth = margin
            + Math.max(...nodes.map(({ el }) => el.offsetLeft + el.offsetWidth));
        totalHeight = margin
            + Math.max(...nodes.map(({ el }) => el.offsetTop + el.offsetHeight));
        canvas.style.width = totalWidth + 'px';
        canvas.style.height = totalHeight + 'px';

        draw();
        if (untouched) fitAll();
    }

    // 辺の四隅の付け根と、そこから外へ向かう単位ベクトルを返す
    function anchor(el, side) {
        const { offsetLeft: l, offsetTop: t, offsetWidth: w, offsetHeight: h } = el;
        return {
            top: [l + w / 2, t, 0, -1],
            bottom: [l + w / 2, t + h, 0, 1],
            left: [l, t + h / 2, -1, 0],
            right: [l + w, t + h / 2, 1, 0],
        }[side] || [l + w / 2, t + h / 2, 0, 0];
    }

    // 私はエッジをクロソイド曲線にした。Obsidianのデフォはベジェです。
    function clothoid(x1, y1, dx1, dy1, x2, y2, dx2, dy2) {
        const span = Math.hypot(x2 - x1, y2 - y1);
        const base = Math.atan2(y2 - y1, x2 - x1);
        const turn = (x, y) => {
            const a = (x || y ? Math.atan2(y, x) : base) - base;
            return Math.atan2(Math.sin(a), Math.cos(a));
        };
        const phi0 = turn(dx1, dy1);
        const phi1 = turn(-dx2, -dy2);

        const bezier = () => {
            const pull = clamp(span * 0.4, 40, 160);
            return `M ${x1} ${y1} `
                + `C ${x1 + dx1 * pull} ${y1 + dy1 * pull}, `
                + `${x2 + dx2 * pull} ${y2 + dy2 * pull}, ${x2} ${y2}`;
        };
        if (span < 1 || Math.abs(phi0) > 3 || Math.abs(phi1) > 3) return bezier();
        const delta = phi1 - phi0;

        const n = 32;
        const moments = (A) => {
            let X = 0, Y = 0, dY = 0;
            for (let i = 0; i <= n; i++) {
                const t = i / n;
                const w = (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) / (3 * n);
                const th = A * t * t + (delta - A) * t + phi0;
                X += w * Math.cos(th);
                Y += w * Math.sin(th);
                dY += w * (t * t - t) * Math.cos(th);
            }
            return [X, Y, dY];
        };

        const solve = (A, i) => {
            const [, Y, dY] = moments(A);
            const move = clamp(Y / dY, -2, 2);
            return i === 30 || Math.abs(dY) < 1e-12 || Math.abs(move) < 1e-12
                ? A
                : solve(A - move, i + 1);
        };
        const A = solve(3 * (phi0 + phi1), 0);

        const [X, Y] = moments(A);
        if (!(X > 0.05) || Math.abs(Y) > 1e-6) return bezier();

        const len = span / X;
        const peak = A ? (A - delta) / (2 * A) : 0;
        const swing = peak > 0 && peak < 1 ? (A - delta) ** 2 / (4 * Math.abs(A)) : 0;
        if (len > span * 3 || swing > Math.PI) return bezier();

        const seg = clamp(Math.ceil((Math.abs(delta) + 2 * swing) * 20), 1, 64);
        const at = (v) => v.toFixed(1);
        let d = `M ${at(x1)} ${at(y1)}`;
        let [x, y] = [x1, y1];
        for (let i = 0; i < seg; i++) {
            const t = (i + 0.5) / seg;
            const th = base + A * t * t + (delta - A) * t + phi0;
            x += Math.cos(th) * len / seg;
            y += Math.sin(th) * len / seg;
            d += i === seg - 1 ? ` L ${at(x2)} ${at(y2)}` : ` L ${at(x)} ${at(y)}`;
        }
        return d;
    }

    // 辺を引き直し、ラベルを曲線の実測中点に置く
    function draw() {
        svg.querySelectorAll('g').forEach((g) => g.remove());
        const labels = [];

        for (const e of edges) {
            const g = create('g', { 'data-from': e.from, 'data-to': e.to }, svg);
            const line = create('path', {
                d: clothoid(
                    ...anchor(document.getElementById(e.from), e.fromSide),
                    ...anchor(document.getElementById(e.to), e.toSide)
                ),
                'marker-end': 'url(#矢)',
            }, g);
            if (!e.label) continue;

            const box = create('foreignObject', { width: 9999, height: 9999 }, g);
            const label = create('div', { class: 'ラベル' }, box);
            label.textContent = e.label;
            const mid = line.getPointAtLength(line.getTotalLength() / 2);
            labels.push({ box, label, mx: mid.x, my: mid.y });
        }

        for (const { box, label, mx, my } of labels) {
            const w = label.offsetWidth + 1;
            const h = label.offsetHeight;
            box.setAttribute('width', w);
            box.setAttribute('height', h);
            box.setAttribute('x', mx - w / 2);
            box.setAttribute('y', my - h / 2);
        }

        applyFocus();
    }

    let focused = null;

    // クリックしたノードと、その隣だけを濃く残す
    function applyFocus() {
        const related = new Set();
        if (focused) {
            related.add(focused);
            for (const e of edges) {
                if (e.from === focused) related.add(e.to);
                if (e.to === focused) related.add(e.from);
            }
        }

        for (const { el } of nodes) {
            el.classList.toggle('半透明', !!focused && !related.has(el.id));
            el.classList.toggle('焦点', el.id === focused);
        }
        for (const g of svg.querySelectorAll('g')) {
            const touches = g.getAttribute('data-from') === focused
                || g.getAttribute('data-to') === focused;
            g.classList.toggle('半透明', !!focused && !touches);
        }
    }

    // 無限キャンバスの操作系統
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let untouched = true;
    const dragThreshold = 5;

    const toLocal = (x, y) => {
        const r = viewport.getBoundingClientRect();
        return [x - r.left, y - r.top];
    };

    const apply = () => {
        canvas.style.transform =
            `translate(${panX}px, ${panY}px) scale(${scale})`;
    };

    // 縦横のうち狭い方に合わせて全体を画面に収める
    function fitAll() {
        const r = viewport.getBoundingClientRect();
        scale = clamp(
            Math.max(r.width / totalWidth, r.height / totalHeight),
            minScale,
            maxScale
        );
        panX = (r.width - totalWidth * scale) / 2;
        panY = (r.height - totalHeight * scale) / 2;
        apply();
    }

    // cx, cy を動かさずに倍率だけ変える
    function zoom(ratio, cx, cy) {
        const next = clamp(scale * ratio, minScale, maxScale);
        panX = cx - (cx - panX) * (next / scale);
        panY = cy - (cy - panY) * (next / scale);
        scale = next;
        apply();
    }

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        untouched = false;
        const amount = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        zoom(Math.exp(-amount * zoomSpeed), ...toLocal(e.clientX, e.clientY));
    }, { passive: false });

    const pointers = new Map();
    let lastPinch = null;
    let dragged = false;

    const beginPan = (e) => {
        dragged = true;
        viewport.classList.add('掴み中');
        try {
            viewport.setPointerCapture(e.pointerId);
        } catch (_) { }
    };

    // 焦点の当たったノードの文字の上だけ掴ませず、選択できるようにする
    viewport.addEventListener('pointerdown', (e) => {
        untouched = false;
        dragged = false;
        lastPinch = null;
        const node = e.target.closest('.ノード');
        const pannable = e.pointerType !== 'mouse' || !node || node.id !== focused
            || !!e.target.closest('img, video, .動画');
        if (pannable) e.preventDefault();
        pointers.set(e.pointerId, {
            x: e.clientX, y: e.clientY,
            sx: e.clientX, sy: e.clientY,
            pannable,
        });
    });

    // 指が2本ならピンチ、1本なら押した位置からdragThreshold超えでパン
    viewport.addEventListener('pointermove', (e) => {
        const p = pointers.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;

        if (pointers.size >= 2) {
            const [a, b] = [...pointers.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const [cx, cy] = toLocal((a.x + b.x) / 2, (a.y + b.y) / 2);
            if (lastPinch) {
                panX += cx - lastPinch.cx;
                panY += cy - lastPinch.cy;
                zoom(dist / lastPinch.dist, cx, cy);
            }
            lastPinch = { dist, cx, cy };
            if (!dragged) beginPan(e);
            return;
        }

        if (!p.pannable) return;
        const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy);
        if (!dragged && moved > dragThreshold) beginPan(e);
        if (!dragged) return;
        panX += dx;
        panY += dy;
        apply();
    });

    const release = (e) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) lastPinch = null;
        if (!pointers.size) viewport.classList.remove('掴み中');
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    // 動かした後のクリックはノードを選ばせずに捨てる
    viewport.addEventListener('click', (e) => {
        if (!dragged) return;
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
    }, true);

    // 文字を選び終えたなら焦点はそのまま
    viewport.addEventListener('click', (e) => {
        if (dragged) return;
        const node = e.target.closest('.ノード');
        const selection = window.getSelection();
        const selecting = node && selection && !selection.isCollapsed
            && (node.contains(selection.anchorNode)
                || node.contains(selection.focusNode));
        if (selecting) return;

        const next = node && node.id !== focused ? node.id : null;
        if (next !== focused) selection?.removeAllRanges();
        focused = next;
        applyFocus();
    });

    viewport.addEventListener('dblclick', (e) => {
        if (scale < 0.9) zoom(1 / scale, ...toLocal(e.clientX, e.clientY));
        else fitAll();
    });

    layout();

    // 画像やフォントが遅れて効いてもノードの寸法を取り直す
    let rafId = 0;
    const relayout = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(layout);
    };
    window.addEventListener('resize', relayout);
    const sizeCheck = new ResizeObserver(relayout);
    nodes.forEach(({ el }) => sizeCheck.observe(el));
    document.fonts?.ready.then(relayout);
})();
