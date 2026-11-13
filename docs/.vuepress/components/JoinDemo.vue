<template>
  <div class="jd">
    <div class="jd-sql"><code>{{ cfg.sql }}</code></div>

    <!-- 两张(或同一张)输入表 -->
    <div class="jd-tables">
      <div v-for="side in sides" :key="side.id" class="jd-box">
        <div class="jd-cap">
          {{ side.t.label }}
          <span v-if="cfg.driving === side.id" class="jd-tag">驱动表</span>
        </div>
        <table>
          <thead>
            <tr>
              <th v-for="c in side.t.cols" :key="c" :class="{ key: c === side.t.key }">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in side.t.rows" :key="i" :class="rowClass(side.id, i)">
              <td v-for="c in side.t.cols" :key="c" :class="{ nul: row[c] === null }">{{ fmt(row[c]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 当前步骤说明 -->
    <div :class="['jd-status', current ? current.state : 'idle']">
      <template v-if="finished">✔ 执行完毕:{{ cfg.finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>{{ cfg.intro }}</template>
    </div>

    <!-- 控制条 -->
    <div class="jd-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <input class="jd-range" type="range" :min="-1" :max="last" v-model.number="cur" @input="pause" />
      <span class="jd-count">{{ cur + 1 }} / {{ steps.length }}</span>
      <select v-model.number="speed">
        <option :value="1400">慢速</option>
        <option :value="800">中速</option>
        <option :value="300">快速</option>
      </select>
    </div>

    <!-- 结果表 -->
    <div class="jd-cap">
      查询结果<span class="jd-count">(共 {{ results.length }} 行)</span>
    </div>
    <div class="jd-result" ref="result">
      <table>
        <thead>
          <tr>
            <th v-for="c in cfg.out" :key="c.label">{{ c.label }}</th>
          </tr>
        </thead>
        <transition-group name="fly" tag="tbody">
          <tr v-for="r in results" :key="r.step" :class="{ latest: r.step === cur, fill: r.fill }">
            <td v-for="c in cfg.out" :key="c.label" :class="{ nul: cell(r, c) === null }">{{ fmt(cell(r, c)) }}</td>
          </tr>
        </transition-group>
      </table>
      <div v-if="!results.length" class="jd-empty">(暂无结果)</div>
    </div>

    <div class="jd-legend">
      <span class="dot ok"></span>条件成立
      <span class="dot bad"></span>条件不成立
      <span class="dot warn"></span>无匹配,NULL 补齐
      <span class="dot plain"></span>直接组合
    </div>
  </div>
</template>

<script>
const EMP = [
  { id: 1, name: '张三', dept_id: 1, manager_id: null },
  { id: 2, name: '李四', dept_id: 1, manager_id: 1 },
  { id: 3, name: '王五', dept_id: 2, manager_id: 1 },
  { id: 4, name: '赵六', dept_id: 2, manager_id: 3 },
  { id: 5, name: '钱七', dept_id: null, manager_id: 1 }
]
const DEPT = [
  { id: 1, name: '研发部' },
  { id: 2, name: '市场部' },
  { id: 3, name: '财务部' }
]
const EMP_COLS = ['id', 'name', 'dept_id', 'manager_id']
const DEPT_COLS = ['id', 'name']

const f = v => (v === null ? 'NULL' : v)

const NOTE = {
  cross: '没有连接条件,左表 5 行 × 右表 3 行 = 15 行。大部分组合都是无意义的(员工并不属于那个部门)。',
  inner: '只保留两边都匹配的 4 行。钱七(dept_id 为 NULL)和财务部(没有员工)都被丢弃了。',
  left: '左表 emp 的 5 行全部保留。钱七没有匹配,右表字段补 NULL;财务部不会出现。',
  right: '右表 dept 的 3 个部门全部保留。财务部没有员工,左表字段补 NULL;钱七不会出现。',
  self: '把 emp 当成两张表:左边是员工 e,右边是领导 m。张三没有领导(manager_id 为 NULL),被内连接丢弃了。',
  selfLeft: '员工 e 全部保留。张三没有领导,所以领导 m 这一侧补 NULL。'
}

function build(mode) {
  const emp = { rows: EMP, cols: EMP_COLS }
  const dept = { rows: DEPT, cols: DEPT_COLS }
  const empOut = ['name', 'dept_id'].map(k => ({ side: 'L', key: k, label: 'emp.' + k }))
  const deptOut = ['id', 'name'].map(k => ({ side: 'R', key: k, label: 'dept.' + k }))
  const byDept = {
    left: { ...emp, label: '员工表 emp', key: 'dept_id' },
    right: { ...dept, label: '部门表 dept', key: 'id' },
    out: [...empOut, ...deptOut],
    cond: (l, r) => l.dept_id !== null && l.dept_id === r.id,
    condText: (l, r) => `emp.dept_id = dept.id → ${f(l.dept_id)} = ${f(r.id)}`
  }
  const bySelf = {
    left: { ...emp, label: '员工 e(emp e)', key: 'manager_id' },
    right: { ...emp, label: '领导 m(emp m)', key: 'id' },
    out: [
      { side: 'L', key: 'name', label: 'e.name' },
      { side: 'L', key: 'manager_id', label: 'e.manager_id' },
      { side: 'R', key: 'id', label: 'm.id' },
      { side: 'R', key: 'name', label: 'm.name' }
    ],
    cond: (l, r) => l.manager_id !== null && l.manager_id === r.id,
    condText: (l, r) => `e.manager_id = m.id → ${f(l.manager_id)} = ${f(r.id)}`
  }
  const sel = 'select emp.name, emp.dept_id, dept.id, dept.name '
  const selSelf = 'select e.name, e.manager_id, m.id, m.name '
  const map = {
    cross: {
      left: { ...emp, label: '员工表 emp' },
      right: { ...dept, label: '部门表 dept' },
      out: [
        ...EMP_COLS.map(k => ({ side: 'L', key: k, label: 'emp.' + k })),
        ...DEPT_COLS.map(k => ({ side: 'R', key: k, label: 'dept.' + k }))
      ],
      sql: 'select * from emp, dept;',
      intro: '没有连接条件:左表的每一行,都要和右表的每一行组合一次。点击「播放」或「下一步」开始。',
      driving: 'L',
      keep: false,
      cond: null,
      pairText: (l, r) => `${l.name} × ${r.name} → 直接组合`
    },
    inner: {
      ...byDept,
      sql: sel + 'from emp inner join dept on emp.dept_id = dept.id;',
      intro: '逐行比较连接条件,成立才输出。点击「播放」或「下一步」开始。',
      driving: 'L',
      keep: false
    },
    left: {
      ...byDept,
      sql: sel + 'from emp left join dept on emp.dept_id = dept.id;',
      intro: '以左表 emp 为驱动表:左表每一行都必须出现在结果里。点击「播放」或「下一步」开始。',
      driving: 'L',
      keep: true
    },
    right: {
      ...byDept,
      sql: sel + 'from emp right join dept on emp.dept_id = dept.id;',
      intro: '以右表 dept 为驱动表:右表每一行都必须出现在结果里。点击「播放」或「下一步」开始。',
      driving: 'R',
      keep: true
    },
    self: {
      ...bySelf,
      sql: selSelf + 'from emp e inner join emp m on e.manager_id = m.id;',
      intro: '同一张 emp 表取两个别名:e 当员工,m 当领导,再按 e.manager_id = m.id 连接。点击「播放」或「下一步」开始。',
      driving: 'L',
      keep: false
    },
    selfLeft: {
      ...bySelf,
      sql: selSelf + 'from emp e left join emp m on e.manager_id = m.id;',
      intro: '自连接 + 左外连接:没有领导的员工也要保留。点击「播放」或「下一步」开始。',
      driving: 'L',
      keep: true
    }
  }
  const cfg = map[mode] || map.cross
  cfg.finalNote = NOTE[mode] || NOTE.cross
  return cfg
}

function buildSteps(cfg) {
  const L = cfg.left.rows
  const R = cfg.right.rows
  const drivingL = cfg.driving === 'L'
  const outer = drivingL ? L : R
  const inner = drivingL ? R : L
  const steps = []

  outer.forEach((o, oi) => {
    let matched = false
    inner.forEach((n, ni) => {
      const li = drivingL ? oi : ni
      const ri = drivingL ? ni : oi
      const l = L[li]
      const r = R[ri]
      if (!cfg.cond) {
        steps.push({ l: li, r: ri, state: 'plain', emit: { l, r }, text: cfg.pairText(l, r) })
        return
      }
      const ok = cfg.cond(l, r)
      matched = matched || ok
      steps.push({
        l: li,
        r: ri,
        state: ok ? 'ok' : 'bad',
        emit: ok ? { l, r } : null,
        text: cfg.condText(l, r) + (ok ? '  ✓ 成立,输出一行' : '  ✗ 不成立,丢弃')
      })
    })
    if (cfg.cond && cfg.keep && !matched) {
      steps.push({
        l: drivingL ? oi : -1,
        r: drivingL ? -1 : oi,
        state: 'warn',
        emit: drivingL ? { l: o, r: null, fill: true } : { l: null, r: o, fill: true },
        text: `「${o.name}」在${drivingL ? '右' : '左'}表里没有任何匹配,但这是${drivingL ? '左' : '右'}外连接,必须保留它 → ${drivingL ? '右' : '左'}侧补 NULL`
      })
    }
  })

  // 给每个输出步骤标上结果行号
  let k = 0
  steps.forEach((s, i) => {
    s.index = i
    if (s.emit) {
      k += 1
      s.text += `(结果第 ${k} 行)`
    }
  })
  return steps
}

export default {
  name: 'JoinDemo',
  props: {
    mode: {
      type: String,
      default: 'cross',
      validator: v => ['cross', 'inner', 'left', 'right', 'self', 'selfLeft'].indexOf(v) !== -1
    }
  },
  data() {
    return { cur: -1, playing: false, speed: 800, timer: null }
  },
  computed: {
    cfg() {
      return build(this.mode)
    },
    steps() {
      return buildSteps(this.cfg)
    },
    sides() {
      return [
        { id: 'L', t: this.cfg.left },
        { id: 'R', t: this.cfg.right }
      ]
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
    results() {
      const out = []
      for (let i = 0; i <= this.cur; i++) {
        const s = this.steps[i]
        if (s && s.emit) out.push({ step: i, l: s.emit.l, r: s.emit.r, fill: !!s.emit.fill })
      }
      return out
    }
  },
  watch: {
    cur() {
      this.$nextTick(() => {
        const el = this.$refs.result
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    fmt: f,
    cell(r, c) {
      const row = c.side === 'L' ? r.l : r.r
      return row ? row[c.key] : null
    },
    rowClass(side, i) {
      const s = this.current
      if (!s) return ''
      const hit = side === 'L' ? s.l === i : s.r === i
      return hit ? ['cur', s.state] : ''
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
.jd {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.jd-sql {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.jd-sql code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.jd-tables {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.jd-box {
  flex: 1 1 260px;
  min-width: 0;
}
.jd-cap {
  margin: 4px 0;
  font-weight: 600;
}
.jd-tag {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 8px;
  background: #3eaf7c;
  color: #fff;
  font-size: 11px;
  font-weight: 400;
}
table {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  display: table;
}
th,
td {
  padding: 3px 8px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  text-align: center;
  white-space: nowrap;
  background: transparent;
}
th {
  background: rgba(128, 128, 128, 0.18);
}
th.key {
  color: #3eaf7c;
}
td.nul {
  color: #e8890c;
  font-style: italic;
}
tbody tr {
  transition: background 0.25s;
}
tr.cur.ok td {
  background: rgba(62, 175, 124, 0.35) !important;
}
tr.cur.bad td {
  background: rgba(230, 70, 70, 0.28) !important;
}
tr.cur.warn td {
  background: rgba(232, 137, 12, 0.35) !important;
}
tr.cur.plain td {
  background: rgba(66, 133, 244, 0.3) !important;
}

.jd-status {
  margin: 10px 0;
  padding: 8px 10px;
  min-height: 2.6em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.jd-status.ok {
  border-color: #3eaf7c;
}
.jd-status.bad {
  border-color: #e64646;
}
.jd-status.warn {
  border-color: #e8890c;
}
.jd-status.plain {
  border-color: #4285f4;
}

.jd-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.jd-ctrl button,
.jd-ctrl select {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.jd-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.jd-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.jd-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.jd-ctrl select option {
  color: #333;
}
.jd-range {
  flex: 1 1 100px;
  min-width: 80px;
  accent-color: #3eaf7c;
}
.jd-count {
  font-weight: 400;
  opacity: 0.75;
}

.jd-result {
  max-height: 260px;
  overflow: auto;
}
.jd-empty {
  padding: 8px;
  text-align: center;
  opacity: 0.5;
}
tr.latest td {
  background: rgba(62, 175, 124, 0.22);
}
tr.fill.latest td {
  background: rgba(232, 137, 12, 0.25);
}
.fly-enter-active {
  transition: all 0.4s;
}
.fly-enter {
  opacity: 0;
  transform: translateY(-10px);
}

.jd-legend {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 0 4px 0 10px;
  border-radius: 2px;
  vertical-align: baseline;
}
.dot:first-child {
  margin-left: 0;
}
.dot.ok {
  background: #3eaf7c;
}
.dot.bad {
  background: #e64646;
}
.dot.warn {
  background: #e8890c;
}
.dot.plain {
  background: #4285f4;
}
</style>
