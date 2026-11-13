<template>
  <div class="ix">
    <div class="ix-sql"><code>{{ sql }}</code></div>

    <div class="ix-param">
      <template v-if="mode === 'range'">
        id 从
        <select v-model.number="lo" @change="reset">
          <option v-for="k in KEYS" :key="k" :value="k">{{ k }}</option>
        </select>
        到
        <select v-model.number="hi" @change="reset">
          <option v-for="k in KEYS" :key="k" :value="k">{{ k }}</option>
        </select>
      </template>
      <template v-else>
        查找的值
        <select v-model.number="target" @change="reset">
          <option v-for="k in TARGETS" :key="k" :value="k">{{ k }}{{ KEYS.indexOf(k) === -1 ? '(不存在)' : '' }}</option>
        </select>
      </template>
    </div>

    <svg :viewBox="'0 0 ' + W + ' 262'" role="img" aria-label="B+树示意图">
      <defs>
        <marker id="ix-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- 父子连线 -->
      <line
        v-for="e in edges"
        :key="e.key"
        :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
        :class="['edge', { taken: takenEdges[e.key] }]"
      />

      <!-- 叶子之间的双向链表 -->
      <line
        v-for="l in links"
        :key="l.key"
        :x1="l.x1" :y1="l.y" :x2="l.x2" :y2="l.y"
        :class="['link', { taken: takenLinks[l.key] }]"
        marker-start="url(#ix-arrow)"
        marker-end="url(#ix-arrow)"
      />

      <!-- 节点 -->
      <g v-for="n in nodeList" :key="n.id" :class="['node', nodeClass(n.id)]">
        <rect class="outline" :x="n.x - 3" :y="n.y - 3" :width="n.w + 6" :height="CH + 6" rx="5" />
        <g v-for="(k, i) in n.keys" :key="i">
          <rect :class="['cell', cellClass(n.id, i)]" :x="n.x + i * CW" :y="n.y" :width="CW" :height="CH" />
          <text :x="n.x + i * CW + CW / 2" :y="n.y + CH / 2 + 4.5">{{ k }}</text>
        </g>
      </g>

      <text class="layer" x="4" y="104">非叶子节点:只存键 + 子节点指针</text>
      <text class="layer" x="4" y="204">叶子节点:存键 + 整行数据,并用双向链表相连</text>
    </svg>

    <div :class="['ix-status', current ? current.state : 'idle']">
      <template v-if="finished">✔ 执行完毕:{{ finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>{{ intro }}</template>
    </div>

    <div class="ix-cost">
      <span class="pill">{{ costText }}</span>
      <span v-if="found.length" class="ix-found">
        查询结果:<span v-for="k in found" :key="k" class="chip">{{ k }}</span>
      </span>
    </div>

    <div class="ix-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <input class="ix-range" type="range" :min="-1" :max="last" v-model.number="cur" @input="pause" />
      <span class="ix-count">{{ cur + 1 }} / {{ steps.length }}</span>
      <select v-model.number="speed">
        <option :value="1500">慢速</option>
        <option :value="900">中速</option>
        <option :value="250">快速</option>
      </select>
    </div>
  </div>
</template>

<script>
const TREE = {
  R: { keys: [35], children: ['I1', 'I2'] },
  I1: { keys: [10, 20], children: ['L1', 'L2', 'L3'] },
  I2: { keys: [50, 65], children: ['L4', 'L5', 'L6'] },
  L1: { keys: [3, 5, 8] },
  L2: { keys: [10, 12, 17] },
  L3: { keys: [20, 25, 30] },
  L4: { keys: [35, 40, 45] },
  L5: { keys: [50, 55, 60] },
  L6: { keys: [65, 70, 80] }
}
const LEAVES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
const KEYS = [].concat(...LEAVES.map(id => TREE[id].keys))
const TARGETS = [...KEYS, 33, 100].sort((a, b) => a - b)
const CW = 34
const CH = 28
const W = 720

function layout() {
  const pos = {}
  LEAVES.forEach((id, i) => {
    pos[id] = { x: 9 + i * 120, y: 214 - 4, w: TREE[id].keys.length * CW }
  })
  const center = id => pos[id].x + pos[id].w / 2
  ;['I1', 'I2'].forEach(id => {
    const ch = TREE[id].children
    const c = (center(ch[0]) + center(ch[ch.length - 1])) / 2
    const w = TREE[id].keys.length * CW
    pos[id] = { x: c - w / 2, y: 114 - 4, w }
  })
  const rc = (center('I1') + center('I2')) / 2
  const rw = TREE.R.keys.length * CW
  pos.R = { x: rc - rw / 2, y: 14, w: rw }
  return pos
}
const POS = layout()

const nodeName = id => (id === 'R' ? '根节点页' : id[0] === 'I' ? '内部节点页' : '叶子节点页')
const route = (keys, t) => keys.filter(k => t >= k).length

function descend(t) {
  const path = []
  let id = 'R'
  while (TREE[id].children) {
    const idx = route(TREE[id].keys, t)
    path.push({ id, idx, next: TREE[id].children[idx] })
    id = TREE[id].children[idx]
  }
  path.push({ id, leaf: true })
  return path
}

function descendText(p, t) {
  const keys = TREE[p.id].keys
  const idx = p.idx
  const desc =
    idx === 0 ? `${t} < ${keys[0]}` : idx === keys.length ? `${t} ≥ ${keys[idx - 1]}` : `${keys[idx - 1]} ≤ ${t} < ${keys[idx]}`
  return `读取${nodeName(p.id)} [${keys.join(', ')}]:${desc} → 沿第 ${idx + 1} 个指针往下走`
}

function buildSearch(t) {
  const steps = []
  let io = 0
  descend(t).forEach(p => {
    io += 1
    if (!p.leaf) {
      steps.push({ node: p.id, edge: p.id + '>' + p.next, io, state: 'plain', text: descendText(p, t) })
    } else {
      const keys = TREE[p.id].keys
      const hit = keys.indexOf(t)
      steps.push({
        node: p.id,
        io,
        state: hit !== -1 ? 'ok' : 'bad',
        hl: hit !== -1 ? [[p.id, hit, 'ok']] : [],
        found: hit !== -1 ? [t] : [],
        text:
          hit !== -1
            ? `读取叶子节点页 [${keys.join(', ')}]:在页内找到 ${t},叶子里直接存着整行数据,查询结束`
            : `读取叶子节点页 [${keys.join(', ')}]:页里没有 ${t},说明这个值不存在,查询结束`
      })
    }
  })
  return steps
}

function buildScan(t) {
  const steps = []
  let n = 0
  LEAVES.forEach(id => {
    TREE[id].keys.forEach((k, i) => {
      n += 1
      const hit = k === t
      steps.push({
        node: id,
        scanned: n,
        state: hit ? 'ok' : 'plain',
        hl: [[id, i, hit ? 'ok' : 'scan']],
        found: hit ? [t] : [],
        text: `第 ${n} 行:${k} ${hit ? '= ' + t + ' ✓ 匹配' : '≠ ' + t + ',不匹配'}(没有索引,不知道后面还有没有,必须继续往下扫)`
      })
    })
  })
  return steps
}

function buildRange(lo, hi) {
  if (lo > hi) {
    const x = lo
    lo = hi
    hi = x
  }
  const steps = []
  let io = 0
  const path = descend(lo)
  path.forEach(p => {
    io += 1
    if (!p.leaf) {
      steps.push({ node: p.id, edge: p.id + '>' + p.next, io, state: 'plain', text: descendText(p, lo) })
    }
  })
  let li = LEAVES.indexOf(path[path.length - 1].id)
  let all = []
  for (;;) {
    io += 1
    const id = LEAVES[li]
    const keys = TREE[id].keys
    const hl = []
    const got = []
    let stop = false
    keys.forEach((k, i) => {
      if (stop) return
      if (k > hi) {
        stop = true
      } else if (k >= lo) {
        hl.push([id, i, 'ok'])
        got.push(k)
      }
    })
    all = all.concat(got)
    const next = LEAVES[li + 1]
    let tail
    if (stop) tail = ';页里出现了大于 ' + hi + ' 的值,范围结束'
    else if (next) tail = ';本页的值全在范围内,沿叶子链表走向下一页(不用再从根节点找起)'
    else tail = ';已经是最后一页,范围结束'
    steps.push({
      node: id,
      io,
      state: 'ok',
      hl,
      found: all.slice(),
      link: !stop && next ? id + '>' + next : null,
      text: `读取叶子节点页 [${keys.join(', ')}]:${got.length ? '收集 ' + got.join('、') : '没有符合范围的值'}${tail}`
    })
    if (stop || !next) break
    li += 1
  }
  return steps
}

export default {
  name: 'IndexDemo',
  props: {
    mode: { type: String, default: 'search' }
  },
  data() {
    return { cur: -1, playing: false, speed: 900, timer: null, target: 45, lo: 20, hi: 50, KEYS, TARGETS, CW, CH, W }
  },
  computed: {
    steps() {
      if (this.mode === 'scan') return buildScan(this.target)
      if (this.mode === 'range') return buildRange(this.lo, this.hi)
      return buildSearch(this.target)
    },
    sql() {
      if (this.mode === 'scan') return `select * from tb_user where age = ${this.target};   -- age 列没有索引`
      if (this.mode === 'range') {
        const a = Math.min(this.lo, this.hi)
        const b = Math.max(this.lo, this.hi)
        return `select * from tb_user where id between ${a} and ${b};   -- id 是主键`
      }
      return `select * from tb_user where id = ${this.target};   -- id 是主键`
    },
    intro() {
      return {
        search: '主键索引就是一棵 B+ 树:从根节点出发,每一层比较键的大小选一条路,一直走到叶子。点击「播放」开始。',
        scan: '没有索引时,MySQL 只能从头到尾逐行比较(全表扫描)。点击「播放」开始。',
        range: '范围查询:先像等值查询那样找到起点,再沿着叶子之间的链表一路向右。点击「播放」开始。'
      }[this.mode]
    },
    finalNote() {
      const io = this.current ? this.current.io : 0
      return {
        search: `只读取了 ${io} 个页就定位到了数据。这棵树高度为 3,哪怕表里有两千万行,通常也只要 3 次左右的磁盘 I/O。`,
        scan: `一共比较了 ${KEYS.length} 行。表里有两千万行,就要比较两千万次。`,
        range: `根节点到叶子只下降了一次,之后沿链表顺序读取,一共读了 ${io} 个页。叶子本身是有序的,所以范围查询、排序都很高效。`
      }[this.mode]
    },
    last() {
      return this.steps.length - 1
    },
    current() {
      return this.cur >= 0 ? this.steps[this.cur] : null
    },
    finished() {
      return this.cur >= this.last
    },
    nodeList() {
      return Object.keys(TREE).map(id => ({ id, keys: TREE[id].keys, ...POS[id] }))
    },
    edges() {
      const out = []
      Object.keys(TREE).forEach(p => {
        const ch = TREE[p].children
        if (!ch) return
        ch.forEach((c, j) => {
          out.push({
            key: p + '>' + c,
            x1: POS[p].x + j * CW,
            y1: POS[p].y + CH,
            x2: POS[c].x + POS[c].w / 2,
            y2: POS[c].y
          })
        })
      })
      return out
    },
    links() {
      return LEAVES.slice(0, -1).map((id, i) => ({
        key: id + '>' + LEAVES[i + 1],
        x1: POS[id].x + POS[id].w + 1,
        x2: POS[LEAVES[i + 1]].x - 1,
        y: POS[id].y + CH / 2
      }))
    },
    done() {
      return this.steps.slice(0, this.cur + 1)
    },
    takenEdges() {
      const m = {}
      this.done.forEach(s => s.edge && (m[s.edge] = true))
      return m
    },
    takenLinks() {
      const m = {}
      this.done.forEach(s => s.link && (m[s.link] = true))
      return m
    },
    visited() {
      const m = {}
      this.done.forEach(s => (m[s.node] = true))
      return m
    },
    cells() {
      const m = {}
      this.done.forEach((s, i) => {
        ;(s.hl || []).forEach(h => {
          m[h[0] + ':' + h[1]] = { state: h[2], now: i === this.cur }
        })
      })
      return m
    },
    found() {
      return this.current && this.current.found ? this.current.found : []
    },
    costText() {
      const s = this.current
      if (this.mode === 'scan') return `已扫描 ${s ? s.scanned : 0} / ${KEYS.length} 行`
      return `已读取 ${s ? s.io : 0} 个页(每读一个页 ≈ 一次磁盘 I/O)`
    }
  },
  watch: {
    mode() {
      this.reset()
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    nodeClass(id) {
      if (this.mode === 'scan') return id[0] === 'L' ? 'visited' : 'dim'
      const c = this.current
      return [this.visited[id] ? 'visited' : '', c && c.node === id ? 'cur' : '']
    },
    cellClass(id, i) {
      const c = this.cells[id + ':' + i]
      return c ? [c.state, c.now ? 'now' : ''] : ''
    },
    toggle() {
      this.playing ? this.pause() : this.play()
    },
    play() {
      if (this.finished) this.cur = -1
      this.playing = true
      this.advance()
    },
    advance() {
      clearTimeout(this.timer)
      if (this.cur < this.last) this.cur += 1
      if (this.cur >= this.last) {
        this.playing = false
        return
      }
      this.timer = setTimeout(this.advance, this.speed)
    },
    pause() {
      clearTimeout(this.timer)
      this.playing = false
    },
    next() {
      this.pause()
      if (this.cur < this.last) this.cur += 1
    },
    prev() {
      this.pause()
      if (this.cur > -1) this.cur -= 1
    },
    reset() {
      this.pause()
      this.cur = -1
    }
  }
}
</script>

<style scoped>
.ix {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.ix-sql {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.ix-sql code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.ix-param {
  margin-bottom: 6px;
}
.ix select {
  margin: 0 4px;
  padding: 2px 8px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
.ix select option {
  color: #333;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  color: inherit;
}
.edge {
  stroke: rgba(128, 128, 128, 0.55);
  stroke-width: 1.5;
}
.edge.taken {
  stroke: #4285f4;
  stroke-width: 3;
}
.link {
  stroke: rgba(128, 128, 128, 0.55);
  stroke-width: 1.5;
}
.link.taken {
  stroke: #3eaf7c;
  stroke-width: 3;
  color: #3eaf7c;
}
.outline {
  fill: none;
  stroke: transparent;
  stroke-width: 2;
}
.node.visited .outline {
  stroke: rgba(66, 133, 244, 0.6);
}
.node.cur .outline {
  stroke: #4285f4;
  stroke-width: 3;
}
.node.dim {
  opacity: 0.3;
}
.cell {
  fill: rgba(128, 128, 128, 0.12);
  stroke: rgba(128, 128, 128, 0.6);
  transition: fill 0.2s;
}
.cell.scan {
  fill: rgba(128, 128, 128, 0.35);
}
.cell.ok {
  fill: rgba(62, 175, 124, 0.55);
}
.cell.now {
  stroke: #e8890c;
  stroke-width: 3;
}
text {
  font-size: 12px;
  fill: currentColor;
  text-anchor: middle;
}
text.layer {
  text-anchor: start;
  font-size: 11px;
  opacity: 0.6;
}
.ix-status {
  margin: 8px 0;
  padding: 8px 10px;
  min-height: 2.6em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.ix-status.ok {
  border-color: #3eaf7c;
}
.ix-status.bad {
  border-color: #e64646;
}
.ix-status.plain {
  border-color: #4285f4;
}
.ix-cost {
  margin-bottom: 8px;
}
.pill {
  display: inline-block;
  padding: 1px 12px;
  border-radius: 12px;
  background: #4285f4;
  color: #fff;
}
.ix-found {
  margin-left: 10px;
}
.chip {
  display: inline-block;
  margin: 0 3px;
  padding: 0 8px;
  border: 1px solid #3eaf7c;
  border-radius: 10px;
  background: rgba(62, 175, 124, 0.2);
}
.ix-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.ix-ctrl button {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.ix-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.ix-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.ix-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ix-range {
  flex: 1 1 100px;
  min-width: 80px;
  accent-color: #3eaf7c;
}
.ix-count {
  opacity: 0.75;
}
</style>
