<template>
  <div class="bb">
    <div class="bb-top">
      <label>
        插入顺序
        <select v-model="seqKey" @change="reset">
          <option value="ordered">按顺序插入(像自增主键)</option>
          <option value="random">乱序插入(像 UUID 主键)</option>
        </select>
      </label>
      <span class="bb-seq">
        <span
          v-for="(k, i) in seq"
          :key="i"
          :class="['sq', { done: i < insertedCount, now: current && current.key === k && i === insertedIndex }]"
        >{{ k }}</span>
      </span>
    </div>

    <svg :viewBox="'0 0 ' + view.width + ' ' + H" role="img" aria-label="B+树的生长过程">
      <defs>
        <marker id="bb-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <line v-for="e in view.edges" :key="e.key" class="edge" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" />
      <line
        v-for="l in view.links"
        :key="l.key"
        class="link"
        :x1="l.x1" :y1="l.y" :x2="l.x2" :y2="l.y"
        marker-start="url(#bb-arrow)"
        marker-end="url(#bb-arrow)"
      />

      <g v-for="n in view.nodes" :key="n.id" class="bn" :style="{ transform: 'translate(' + n.x + 'px,' + n.y + 'px)' }">
        <rect :class="['outline', hlOf(n.id)]" :x="-3" :y="-3" :width="Math.max(n.keys.length, 1) * CW + 6" :height="CH + 6" rx="5" />
        <template v-if="n.keys.length">
          <g v-for="(k, i) in n.keys" :key="i">
            <rect :class="['cell', { newkey: n.leaf && snap.key === k }]" :x="i * CW" y="0" :width="CW" :height="CH" />
            <text :x="i * CW + CW / 2" :y="CH / 2 + 4.5">{{ k }}</text>
          </g>
        </template>
        <rect v-else class="cell" x="0" y="0" :width="CW" :height="CH" />
      </g>

      <text class="layer" x="4" :y="H - 6">叶子节点之间的 ⇄ 是双向链表;内部节点只存键,叶子节点存键和整行数据</text>
    </svg>

    <div :class="['bb-status', current ? current.kind : 'idle']">
      <template v-if="finished">✔ 全部插入完毕:{{ finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>空表:一个空的叶子节点就是整棵树。每个节点最多放 3 个键,点击「播放」依次插入。</template>
    </div>

    <div class="bb-stat">
      <span class="pill">树高 {{ snap.height }}</span>
      <span class="pill">节点分裂 {{ snap.splits }} 次</span>
      <span class="legend"><i class="o"></i>溢出</span>
      <span class="legend"><i class="s"></i>被分裂</span>
      <span class="legend"><i class="n"></i>新节点</span>
      <span class="legend"><i class="p"></i>查找路径</span>
    </div>

    <div class="bb-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <input class="bb-range" type="range" :min="-1" :max="last" v-model.number="cur" @input="pause" />
      <span class="bb-count">{{ cur + 1 }} / {{ steps.length }}</span>
      <select v-model.number="speed">
        <option :value="1800">慢速</option>
        <option :value="1100">中速</option>
        <option :value="450">快速</option>
      </select>
    </div>
  </div>
</template>

<script>
const MAX = 3
const CW = 34
const CH = 28
const H = 230
const SEQS = {
  ordered: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  random: [8, 3, 11, 1, 6, 10, 4, 12, 2, 9, 5, 7]
}

const clone = n => JSON.parse(JSON.stringify(n))
const heightOf = n => (n.leaf ? 1 : 1 + heightOf(n.children[0]))

function simulate(seq) {
  let uid = 0
  const mk = (leaf, keys, children) => ({ id: ++uid, leaf, keys, children: children || null })
  let root = mk(true, [])
  let splits = 0
  const snaps = []
  let curSi = 0
  const emit = (kind, text, hl, key) =>
    snaps.push({ tree: clone(root), kind, text, hl, key, si: curSi, splits, height: heightOf(root) })

  seq.forEach((k, si) => {
    curSi = si
    const path = []
    let n = root
    while (!n.leaf) {
      const idx = n.keys.filter(x => k >= x).length
      path.push({ n, idx })
      n = n.children[idx]
    }
    const hp = { [n.id]: 'path' }
    path.forEach(p => (hp[p.n.id] = 'path'))
    emit('path', `插入 ${k}:从根节点出发,逐层比较大小,找到它应该落进的叶子节点`, hp, k)

    n.keys.push(k)
    n.keys.sort((a, b) => a - b)
    if (n.keys.length <= MAX) {
      emit('put', `${k} 放进叶子节点,现在有 ${n.keys.length} 个键,没有超过上限 ${MAX},直接完成`, { [n.id]: 'cur' }, k)
      return
    }
    emit('overflow', `${k} 放进叶子节点后,有 ${n.keys.length} 个键,超过了上限 ${MAX},这个页放不下了 → 需要分裂`, { [n.id]: 'overflow' }, k)

    let cur = n
    while (cur.keys.length > MAX) {
      splits += 1
      const before = cur.keys.slice()
      let right
      let sep
      let how
      if (cur.leaf) {
        right = mk(true, cur.keys.splice(2))
        sep = right.keys[0]
        how = `分裂叶子节点 [${before.join(', ')}]:前一半 [${cur.keys.join(', ')}] 留在原页,后一半 [${right.keys.join(', ')}] 放进新页。新页的第一个键 ${sep} 被"复制"一份放进父节点当分界(叶子里依然保留它)`
      } else {
        const keys = cur.keys
        const ch = cur.children
        sep = keys[2]
        right = mk(false, keys.slice(3), ch.slice(3))
        cur.keys = keys.slice(0, 2)
        cur.children = ch.slice(0, 3)
        how = `分裂内部节点 [${before.join(', ')}]:中间的键 ${sep} "上移"到父节点,不再留在内部节点里;左右两半各自成为一个节点`
      }
      const parent = path.pop()
      if (!parent) {
        root = mk(false, [sep], [cur, right])
        emit('split', `${how}。它是根节点,没有父节点可以放分界键 → 创建一个新的根节点,树长高了一层(树高 ${heightOf(root)})`, { [cur.id]: 'split', [right.id]: 'new', [root.id]: 'new' }, k)
        break
      }
      parent.n.keys.splice(parent.idx, 0, sep)
      parent.n.children.splice(parent.idx + 1, 0, right)
      const over = parent.n.keys.length > MAX
      emit(
        'split',
        `${how}。` + (over ? `父节点现在有 ${parent.n.keys.length} 个键,也超限了 → 继续向上分裂` : `父节点现在有 ${parent.n.keys.length} 个键,没有超限,分裂到此结束`),
        { [cur.id]: 'split', [right.id]: 'new', [parent.n.id]: over ? 'overflow' : 'cur' },
        k
      )
      cur = parent.n
    }
  })
  return snaps
}

function layout(root) {
  const nodes = []
  const edges = []
  const leaves = []
  let x = 10
  const GAP = 18
  const walk = (n, depth) => {
    const w = Math.max(n.keys.length, 1) * CW
    if (n.leaf) {
      n.x = x
      x += w + GAP
      leaves.push(n)
    } else {
      n.children.forEach(c => walk(c, depth + 1))
      const f = n.children[0]
      const l = n.children[n.children.length - 1]
      n.x = (f.x + (Math.max(f.keys.length, 1) * CW) / 2 + l.x + (Math.max(l.keys.length, 1) * CW) / 2) / 2 - w / 2
    }
    n.w = w
    n.y = 16 + depth * 76
    nodes.push(n)
  }
  walk(root, 0)
  nodes.forEach(n => {
    if (n.leaf) return
    n.children.forEach((c, j) => {
      edges.push({
        key: n.id + '>' + c.id,
        x1: n.x + j * CW,
        y1: n.y + CH,
        x2: c.x + c.w / 2,
        y2: c.y
      })
    })
  })
  const links = leaves.slice(0, -1).map((l, i) => ({
    key: l.id + '>' + leaves[i + 1].id,
    x1: l.x + l.w + 1,
    x2: leaves[i + 1].x - 1,
    y: l.y + CH / 2
  }))
  return { nodes, edges, links, width: Math.max(620, x + 10) }
}

export default {
  name: 'BPlusBuildDemo',
  props: { mode: { type: String, default: 'ordered' } },
  data() {
    return { cur: -1, playing: false, speed: 1100, timer: null, seqKey: this.mode, CW, CH, H }
  },
  computed: {
    seq() {
      return SEQS[this.seqKey]
    },
    steps() {
      return simulate(this.seq)
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
    snap() {
      return this.current || { tree: { id: 0, leaf: true, keys: [], children: null }, hl: {}, splits: 0, height: 1 }
    },
    view() {
      return layout(clone(this.snap.tree))
    },
    insertedIndex() {
      return this.current ? this.current.si : -1
    },
    insertedCount() {
      return this.current ? this.current.si + (this.current.kind === 'path' ? 0 : 1) : 0
    },
    finalNote() {
      const s = this.snap.splits
      return this.seqKey === 'ordered'
        ? `共 ${this.seq.length} 个键,分裂 ${s} 次,树高 ${this.snap.height}。顺序插入时,新键总是落在最右边的叶子里,只有最右边的页会写满、分裂,左边已经写好的页不会再动。`
        : `共 ${this.seq.length} 个键,分裂 ${s} 次,树高 ${this.snap.height}。乱序插入时,新键会落到树里任意位置的页中,哪个页满了就分裂哪个,数据要在页之间来回搬移,容易产生页碎片(页分裂)。`
    }
  },
  watch: {
    mode(v) {
      this.seqKey = v
      this.reset()
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    hlOf(id) {
      return (this.snap.hl && this.snap.hl[id]) || ''
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
.bb {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.bb-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.bb select {
  margin-left: 4px;
  padding: 2px 8px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
.bb select option {
  color: #333;
}
.sq {
  display: inline-block;
  min-width: 22px;
  margin: 1px;
  padding: 0 4px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 4px;
  text-align: center;
  opacity: 0.5;
}
.sq.done {
  opacity: 1;
  background: rgba(62, 175, 124, 0.25);
  border-color: #3eaf7c;
}
.sq.now {
  border-color: #e8890c;
  box-shadow: 0 0 0 2px rgba(232, 137, 12, 0.5);
}
svg {
  display: block;
  width: 100%;
  height: auto;
  color: inherit;
}
.bn {
  transition: transform 0.5s ease;
}
.edge {
  stroke: rgba(128, 128, 128, 0.6);
  stroke-width: 1.5;
}
.link {
  stroke: rgba(128, 128, 128, 0.55);
  stroke-width: 1.5;
}
.outline {
  fill: none;
  stroke: transparent;
  stroke-width: 3;
}
.outline.path {
  stroke: #4285f4;
}
.outline.cur {
  stroke: #3eaf7c;
}
.outline.overflow {
  stroke: #e64646;
}
.outline.split {
  stroke: #e8890c;
}
.outline.new {
  stroke: #3eaf7c;
  stroke-dasharray: 5 3;
}
.cell {
  fill: rgba(128, 128, 128, 0.12);
  stroke: rgba(128, 128, 128, 0.6);
}
.cell.newkey {
  fill: rgba(62, 175, 124, 0.55);
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
.bb-status {
  margin: 8px 0;
  padding: 8px 10px;
  min-height: 3.2em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.bb-status.path {
  border-color: #4285f4;
}
.bb-status.put {
  border-color: #3eaf7c;
}
.bb-status.overflow {
  border-color: #e64646;
}
.bb-status.split {
  border-color: #e8890c;
}
.bb-stat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.pill {
  padding: 1px 12px;
  border-radius: 12px;
  background: #4285f4;
  color: #fff;
}
.legend {
  font-size: 12px;
  opacity: 0.85;
}
.legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border: 2px solid;
  border-radius: 2px;
  vertical-align: -1px;
}
.legend i.o {
  border-color: #e64646;
}
.legend i.s {
  border-color: #e8890c;
}
.legend i.n {
  border-color: #3eaf7c;
  border-style: dashed;
}
.legend i.p {
  border-color: #4285f4;
}
.bb-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.bb-ctrl button {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.bb-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.bb-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.bb-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.bb-range {
  flex: 1 1 100px;
  min-width: 80px;
  accent-color: #3eaf7c;
}
.bb-count {
  opacity: 0.75;
}
</style>
