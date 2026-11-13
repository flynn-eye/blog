<template>
  <div class="pg">
    <!-- 页的整体结构 -->
    <div class="pg-cap">InnoDB 一个页(16KB)的内部结构</div>
    <div class="pg-bar">
      <div v-for="p in PARTS" :key="p.name" :class="['part', p.cls]" :style="{ flexGrow: p.grow }" :title="p.desc">{{ p.name }}</div>
    </div>
    <div class="pg-sub">点击下面的「播放」,看看在页内是怎么快速找到一条记录的(只展开"用户记录"和"页目录"两部分)</div>

    <div class="pg-param">
      查找主键
      <select v-model.number="target" @change="reset">
        <option v-for="k in TARGETS" :key="k" :value="k">{{ k }}{{ RECS.indexOf(k) === -1 ? '(不存在)' : '' }}</option>
      </select>
    </div>

    <div class="pg-cap">页目录(Page Directory):每个槽指向一组记录里<b>最大</b>的那条</div>
    <div class="pg-slots">
      <div v-for="(s, i) in SLOTS" :key="i" :class="['slot', slotCls(i)]">
        槽 {{ i }}<br /><small>→ {{ ITEMS[s].label }}</small>
      </div>
    </div>

    <div class="pg-cap">用户记录(User Records):按主键升序,用 next_record 指针串成单向链表</div>
    <div class="pg-recs">
      <template v-for="(it, i) in ITEMS">
        <div :key="'r' + i" :class="['rec', 'g' + groupOf(i), recCls(i), { sys: it.sys }]">
          {{ it.label }}
          <span v-if="slotIndexOf(i) !== -1" class="badge">槽{{ slotIndexOf(i) }}</span>
        </div>
        <span v-if="i < ITEMS.length - 1" :key="'a' + i" class="arrow">→</span>
      </template>
    </div>

    <div :class="['pg-status', current ? current.state : 'idle']">
      <template v-if="finished">✔ 查找完成:{{ finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>如果沿着链表从头一条条比较,最坏要比较 {{ RECS.length }} 次;有了页目录,可以先二分,再在一小组里顺序比较。</template>
    </div>
    <div class="pg-cost"><span class="pill">已比较 {{ current ? current.cmp : 0 }} 次</span></div>

    <div class="pg-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <span class="pg-count">{{ cur + 1 }} / {{ steps.length }}</span>
    </div>
  </div>
</template>

<script>
const PARTS = [
  { name: 'File Header', grow: 3, cls: 'a', desc: '文件头 38 字节:页号、上一页、下一页(把页串成双向链表)、页类型等' },
  { name: 'Page Header', grow: 3, cls: 'a', desc: '页头 56 字节:本页的记录数、槽数、空闲空间位置等状态信息' },
  { name: 'Infimum + Supremum', grow: 3, cls: 'b', desc: '最小记录和最大记录(虚拟记录),用来当链表的头和尾' },
  { name: 'User Records', grow: 10, cls: 'c', desc: '用户记录:真正存放的行数据(叶子页)或键+指针(非叶子页)' },
  { name: 'Free Space', grow: 5, cls: 'd', desc: '空闲空间:新记录插入时从这里分配,用完就要新开页' },
  { name: 'Page Directory', grow: 3, cls: 'c', desc: '页目录:一组"槽",每个槽指向一组记录里最大的那条,用于二分查找' },
  { name: 'File Trailer', grow: 2, cls: 'a', desc: '文件尾 8 字节:校验和,用于检查页是否完整写入磁盘' }
]
const RECS = [2, 5, 9, 12, 17, 21, 26, 30, 35, 41, 47, 52]
const ITEMS = [
  { label: 'Infimum', v: -Infinity, sys: true },
  ...RECS.map(v => ({ label: String(v), v })),
  { label: 'Supremum', v: Infinity, sys: true }
]
const SLOTS = [0, 4, 8, 13] // 每个槽指向的记录在 ITEMS 里的下标
const TARGETS = [...RECS, 20, 60].sort((a, b) => a - b)

function build(t) {
  const steps = []
  let cmp = 0
  let low = 0
  let high = SLOTS.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    const it = ITEMS[SLOTS[mid]]
    cmp += 1
    const lt = it.v < t
    steps.push({
      state: 'plain',
      cmp,
      slot: mid,
      rec: SLOTS[mid],
      text: `二分查找页目录:槽 ${mid} 指向记录 ${it.label},${it.label} ${lt ? '<' : '≥'} ${t} → ${lt ? '目标在它的右边,low = ' + mid : '目标在它的左边(或就是它),high = ' + mid}`
    })
    if (lt) low = mid
    else high = mid
  }
  const first = SLOTS[low] + 1
  const lastIdx = SLOTS[high]
  const range = []
  for (let i = first; i <= lastIdx; i++) range.push(i)
  steps.push({
    state: 'plain',
    cmp,
    range,
    text: `二分结束:目标只可能在槽 ${low} 之后、槽 ${high}(含)之前的这一组里。接下来沿 next_record 指针在组内逐条比较,一组最多只有 4~8 条`
  })
  let found = false
  for (let i = first; i <= lastIdx; i++) {
    const it = ITEMS[i]
    cmp += 1
    if (it.v === t) {
      found = true
      steps.push({ state: 'ok', cmp, range, rec: i, text: `比较记录 ${it.label}:${it.label} = ${t} ✓ 找到了` })
      break
    }
    if (it.v > t) {
      steps.push({ state: 'bad', cmp, range, rec: i, text: `比较记录 ${it.label}:${it.label} > ${t},链表是有序的,后面只会更大 → 页里没有 ${t}` })
      break
    }
    steps.push({ state: 'plain', cmp, range, rec: i, text: `比较记录 ${it.label}:${it.label} < ${t},继续沿 next_record 找下一条` })
  }
  return { steps, found, cmp }
}

export default {
  name: 'PageDemo',
  data() {
    return { cur: -1, playing: false, timer: null, target: 30, PARTS, RECS, ITEMS, SLOTS, TARGETS }
  },
  computed: {
    built() {
      return build(this.target)
    },
    steps() {
      return this.built.steps
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
    finalNote() {
      const seq = this.built.found ? RECS.indexOf(this.target) + 1 : RECS.length
      const head = this.built.found
        ? `一共比较了 ${this.built.cmp} 次(二分 + 组内顺序),从头顺序扫描要 ${seq} 次。`
        : `一共比较了 ${this.built.cmp} 次就确定页里没有这个值,从头顺序扫描要 ${seq} 次。`
      return head + '这个演示页只有 12 条记录,优势还不明显;真实的 16KB 页里往往有几十到上千条记录,页目录的二分就会快得多。'
    }
  },
  watch: {
    target() {
      this.reset()
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    slotIndexOf(i) {
      return SLOTS.indexOf(i)
    },
    groupOf(i) {
      for (let g = 0; g < SLOTS.length; g++) if (SLOTS[g] >= i) return g % 2
      return 0
    },
    slotCls(i) {
      const s = this.current
      return s && s.slot === i ? 'cur' : ''
    },
    recCls(i) {
      const s = this.current
      if (!s) return ''
      const out = []
      if (s.range && s.range.indexOf(i) !== -1) out.push('inrange')
      if (s.rec === i) out.push('cur', s.state)
      return out
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
      this.timer = setTimeout(this.advance, 1300)
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
.pg {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.pg-cap {
  margin: 10px 0 4px;
  font-weight: 600;
}
.pg-sub {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
}
.pg-bar {
  display: flex;
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 6px;
}
.part {
  flex-basis: 0;
  padding: 6px 2px;
  border-right: 1px solid rgba(128, 128, 128, 0.4);
  font-size: 11px;
  text-align: center;
  cursor: help;
}
.part:last-child {
  border-right: none;
}
.part.a {
  background: rgba(128, 128, 128, 0.2);
}
.part.b {
  background: rgba(232, 137, 12, 0.25);
}
.part.c {
  background: rgba(62, 175, 124, 0.35);
  font-weight: 700;
}
.part.d {
  background: rgba(128, 128, 128, 0.06);
}
.pg-param {
  margin-top: 10px;
}
select {
  margin: 0 4px;
  padding: 2px 8px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
select option {
  color: #333;
}
.pg-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.slot {
  padding: 3px 12px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 6px;
  text-align: center;
  transition: background 0.2s;
}
.slot small {
  opacity: 0.8;
}
.slot.cur {
  border-color: #e8890c;
  background: rgba(232, 137, 12, 0.3);
}
.pg-recs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.rec {
  position: relative;
  padding: 4px 10px 4px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  transition: background 0.2s;
}
.rec.g0 {
  background: rgba(66, 133, 244, 0.1);
}
.rec.g1 {
  background: rgba(128, 128, 128, 0.12);
}
.rec.sys {
  font-style: italic;
  opacity: 0.8;
}
.rec.inrange {
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.6);
}
.rec.cur.plain {
  background: rgba(232, 137, 12, 0.4);
}
.rec.cur.ok {
  background: rgba(62, 175, 124, 0.5);
}
.rec.cur.bad {
  background: rgba(230, 70, 70, 0.35);
}
.badge {
  position: absolute;
  top: -9px;
  right: -4px;
  padding: 0 4px;
  border-radius: 6px;
  background: #4285f4;
  color: #fff;
  font-size: 10px;
  font-style: normal;
}
.arrow {
  opacity: 0.5;
}
.pg-status {
  margin: 12px 0 8px;
  padding: 8px 10px;
  min-height: 3.2em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.pg-status.ok {
  border-color: #3eaf7c;
}
.pg-status.bad {
  border-color: #e64646;
}
.pg-status.plain {
  border-color: #4285f4;
}
.pg-cost {
  margin-bottom: 8px;
}
.pill {
  padding: 1px 12px;
  border-radius: 12px;
  background: #4285f4;
  color: #fff;
}
.pg-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pg-ctrl button {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.pg-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.pg-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.pg-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pg-count {
  opacity: 0.75;
}
</style>
