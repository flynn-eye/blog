<template>
  <div class="sd">
    <div class="sd-sql"><code>{{ spec.sql }}</code></div>

    <div class="sd-grid">
      <!-- 外层查询的表 -->
      <div class="sd-box">
        <div class="sd-cap">外层查询:{{ spec.outer.label }}</div>
        <table>
          <thead>
            <tr>
              <th v-for="c in spec.outer.cols" :key="c">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in spec.outer.rows" :key="i" :class="rowClass(i)">
              <td v-for="c in spec.outer.cols" :key="c" :class="{ nul: row[c] === null }">{{ fmt(row[c]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 子查询面板 -->
      <div :class="['sd-box', 'sd-panel', { pulse: current && current.state === 'inner' }]">
        <div class="sd-cap">子查询(内层)</div>
        <div class="sd-innersql"><code>{{ spec.innerSql }}</code></div>
        <div class="sd-label">{{ panel ? panel.label : '子查询的结果' }}</div>
        <div class="sd-chips">
          <template v-if="panel">
            <span v-for="(it, i) in panel.items" :key="i" :class="['chip', { nul: it === 'NULL' }]">{{ it }}</span>
            <span v-if="!panel.items.length" class="chip empty">(空,没有任何行)</span>
          </template>
          <span v-else class="chip empty">尚未执行</span>
        </div>
      </div>
    </div>

    <!-- 当前步骤说明 -->
    <div :class="['sd-status', current ? current.state : 'idle']">
      <template v-if="finished">✔ 执行完毕:{{ spec.finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>{{ spec.intro }}</template>
    </div>

    <!-- 控制条 -->
    <div class="sd-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <input class="sd-range" type="range" :min="-1" :max="last" v-model.number="cur" @input="pause" />
      <span class="sd-count">{{ cur + 1 }} / {{ steps.length }}</span>
      <select v-model.number="speed">
        <option :value="1600">慢速</option>
        <option :value="900">中速</option>
        <option :value="350">快速</option>
      </select>
    </div>

    <!-- 结果表 -->
    <div class="sd-cap">
      最终结果<span class="sd-count">(共 {{ results.length }} 行)</span>
    </div>
    <div class="sd-result" ref="result">
      <table>
        <thead>
          <tr>
            <th v-for="c in spec.outer.cols" :key="c">{{ c }}</th>
          </tr>
        </thead>
        <transition-group name="fly" tag="tbody">
          <tr v-for="r in results" :key="r.step" :class="{ latest: r.step === cur }">
            <td v-for="c in spec.outer.cols" :key="c" :class="{ nul: r.row[c] === null }">{{ fmt(r.row[c]) }}</td>
          </tr>
        </transition-group>
      </table>
      <div v-if="!results.length" class="sd-empty">(暂无结果)</div>
    </div>

    <div class="sd-legend">
      <span class="dot ok"></span>条件为真,输出
      <span class="dot bad"></span>条件为假,丢弃
      <span class="dot warn"></span>结果为 NULL(UNKNOWN),丢弃
      <span class="dot inner"></span>子查询执行
    </div>
  </div>
</template>

<script>
const EMP = [
  { id: 1, name: '张三', dept_id: 1, salary: 20000 },
  { id: 2, name: '李四', dept_id: 1, salary: 12000 },
  { id: 3, name: '王五', dept_id: 2, salary: 15000 },
  { id: 4, name: '赵六', dept_id: 2, salary: 9000 },
  { id: 5, name: '钱七', dept_id: null, salary: 8000 }
]
const DEPT = [
  { id: 1, name: '研发部' },
  { id: 2, name: '市场部' },
  { id: 3, name: '财务部' }
]
const EMP_COLS = ['id', 'name', 'dept_id', 'salary']
const DEPT_COLS = ['id', 'name']

const f = v => (v === null ? 'NULL' : v)
const list = arr => '(' + arr.map(f).join(', ') + ')'
const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length

function build(mode) {
  const empT = { label: '员工表 emp', cols: EMP_COLS, rows: EMP }
  const deptT = { label: '部门表 dept', cols: DEPT_COLS, rows: DEPT }

  // ---- 标量子查询:先算出一个值,再逐行比较 ----
  const total = avg(EMP.map(e => e.salary))
  const scalar = {
    sql: 'select * from emp where salary > (select avg(salary) from emp);',
    innerSql: 'select avg(salary) from emp',
    outer: empT,
    intro: '子查询只返回一个值(标量),外层把它当作普通常量来比较。点击「播放」或「下一步」开始。',
    pre: {
      label: '返回 1 行 1 列',
      items: [String(total)],
      text: `第一步:先执行子查询,算出所有员工的平均工资 = ${total}。这个子查询只会执行一次。`
    },
    eval: row => ({
      ok: row.salary > total,
      text: `salary > ${total} → ${row.salary} > ${total}`
    }),
    finalNote: `平均工资是 ${total},工资高于它的只有张三和王五。`
  }

  // ---- 列子查询 IN ----
  const ids = [1, 2]
  const colIn = {
    sql: "select * from emp where dept_id in (select id from dept where name in ('研发部', '市场部'));",
    innerSql: "select id from dept where name in ('研发部', '市场部')",
    outer: empT,
    intro: '子查询返回一列多行,外层用 IN 判断"是否在这个集合里"。点击「播放」或「下一步」开始。',
    pre: {
      label: `返回 ${ids.length} 行 1 列`,
      items: ids.map(String),
      text: `第一步:先执行子查询,得到集合 ${list(ids)}。`
    },
    eval: row => {
      if (row.dept_id === null) {
        return { ok: null, text: `dept_id IN ${list(ids)} → NULL IN ${list(ids)},NULL 与任何值比较都得到 UNKNOWN` }
      }
      return { ok: ids.indexOf(row.dept_id) !== -1, text: `dept_id IN ${list(ids)} → ${row.dept_id} IN ${list(ids)}` }
    },
    finalNote: '研发部、市场部的 4 名员工被查出;钱七的 dept_id 是 NULL,不在集合里。'
  }

  // ---- NOT IN(含 NULL 的陷阱)----
  const buildNotIn = withNull => {
    const vals = EMP.map(e => e.dept_id).filter(v => withNull || v !== null)
    const hasNull = vals.indexOf(null) !== -1
    return {
      sql: withNull
        ? 'select * from dept where id not in (select dept_id from emp);'
        : 'select * from dept where id not in (select dept_id from emp where dept_id is not null);',
      innerSql: withNull ? 'select dept_id from emp' : 'select dept_id from emp where dept_id is not null',
      outer: deptT,
      intro: withNull
        ? '想查"没有员工的部门"。注意:子查询的结果里藏着一个 NULL(钱七)。点击「播放」或「下一步」开始。'
        : '在子查询里把 NULL 排除掉,再用 NOT IN。点击「播放」或「下一步」开始。',
      pre: {
        label: `返回 ${vals.length} 行 1 列`,
        items: vals.map(f).map(String),
        text: `第一步:先执行子查询,得到 ${list(vals)}${hasNull ? ',其中包含 NULL!' : '。'}`
      },
      eval: row => {
        if (vals.indexOf(row.id) !== -1) {
          return { ok: false, text: `id NOT IN ${list(vals)} → ${row.id} 在集合里,NOT IN 为假` }
        }
        if (hasNull) {
          return {
            ok: null,
            text: `id NOT IN ${list(vals)} → ${row.id} <> NULL 的结果是 UNKNOWN,整个 NOT IN 就不可能为真`
          }
        }
        return { ok: true, text: `id NOT IN ${list(vals)} → ${row.id} 不在集合里,NOT IN 为真` }
      },
      finalNote: withNull
        ? '结果是 0 行!本该查出财务部,却因为子查询里有 NULL 而什么都查不到。'
        : '财务部被正确地查了出来。'
    }
  }

  // ---- 相关子查询:每一行都要重新执行一次子查询 ----
  const correlated = {
    sql: 'select * from emp e where salary > (select avg(salary) from emp where dept_id = e.dept_id);',
    innerSql: 'select avg(salary) from emp where dept_id = e.dept_id',
    outer: empT,
    intro: '子查询里用到了外层的 e.dept_id,所以外层每一行都要"代入"后重新执行一次子查询。点击「播放」或「下一步」开始。',
    pre: null,
    eval: row => {
      const peers = row.dept_id === null ? [] : EMP.filter(e => e.dept_id === row.dept_id).map(e => e.salary)
      if (!peers.length) {
        return {
          ok: null,
          panel: { label: 'e.dept_id = NULL → 同部门没有任何人', items: ['NULL'] },
          text: `代入 e.dept_id = NULL:没有任何行满足 dept_id = NULL,avg 为 NULL;${row.salary} > NULL 为 UNKNOWN`
        }
      }
      const a = avg(peers)
      return {
        ok: row.salary > a,
        panel: { label: `e.dept_id = ${row.dept_id} → 同部门工资 ${list(peers)}`, items: ['avg = ' + a] },
        text: `代入 e.dept_id = ${row.dept_id}:部门平均工资 ${a};${row.salary} > ${a}`
      }
    },
    finalNote: '工资高于"本部门"平均工资的是张三(高于研发部 16000)和王五(高于市场部 12000)。'
  }

  // ---- EXISTS / NOT EXISTS ----
  const buildExists = negate => ({
    sql: negate
      ? 'select * from dept d where not exists (select 1 from emp e where e.dept_id = d.id);'
      : 'select * from dept d where exists (select 1 from emp e where e.dept_id = d.id);',
    innerSql: 'select 1 from emp e where e.dept_id = d.id',
    outer: deptT,
    intro: negate
      ? 'NOT EXISTS:子查询一行都找不到才算真。点击「播放」或「下一步」开始。'
      : 'EXISTS 只关心子查询"有没有结果",不关心结果是什么。点击「播放」或「下一步」开始。',
    pre: null,
    eval: row => {
      const found = EMP.filter(e => e.dept_id === row.id)
      const exist = found.length > 0
      return {
        ok: negate ? !exist : exist,
        panel: { label: `d.id = ${row.id} → 找到 ${found.length} 行`, items: found.map(e => e.name) },
        text: `代入 d.id = ${row.id}:子查询${exist ? '找到了 ' + found.length + ' 行' : '一行也没找到'},${negate ? 'NOT ' : ''}EXISTS 为${(negate ? !exist : exist) ? '真' : '假'}`
      }
    },
    finalNote: negate ? '没有员工的部门只有财务部。' : '有员工的部门是研发部和市场部。'
  })

  const map = {
    scalar,
    in: colIn,
    notin: buildNotIn(true),
    notinFix: buildNotIn(false),
    correlated,
    exists: buildExists(false),
    notexists: buildExists(true)
  }
  return map[mode] || map.scalar
}

function buildSteps(spec) {
  const steps = []
  let panel = null
  if (spec.pre) {
    panel = { label: spec.pre.label, items: spec.pre.items }
    steps.push({ outer: -1, state: 'inner', text: spec.pre.text, panel, emit: null })
  }
  let k = 0
  spec.outer.rows.forEach((row, i) => {
    const ev = spec.eval(row)
    if (ev.panel) panel = ev.panel
    const emit = ev.ok === true
    if (emit) k += 1
    steps.push({
      outer: i,
      state: ev.ok === true ? 'ok' : ev.ok === false ? 'bad' : 'warn',
      text: ev.text + (ev.ok === true ? `  ✓ 为真,输出(结果第 ${k} 行)` : ev.ok === false ? '  ✗ 为假,丢弃' : '  ✗ 结果为 UNKNOWN,丢弃'),
      panel,
      emit: emit ? row : null
    })
  })
  return steps
}

export default {
  name: 'SubqueryDemo',
  props: {
    mode: {
      type: String,
      default: 'scalar',
      validator: v => ['scalar', 'in', 'notin', 'notinFix', 'correlated', 'exists', 'notexists'].indexOf(v) !== -1
    }
  },
  data() {
    return { cur: -1, playing: false, speed: 900, timer: null }
  },
  computed: {
    spec() {
      return build(this.mode)
    },
    steps() {
      return buildSteps(this.spec)
    },
    last() {
      return this.steps.length - 1
    },
    current() {
      return this.cur >= 0 ? this.steps[this.cur] : null
    },
    panel() {
      return this.current ? this.current.panel : null
    },
    finished() {
      return this.cur >= this.last
    },
    results() {
      const out = []
      for (let i = 0; i <= this.cur; i++) {
        const s = this.steps[i]
        if (s && s.emit) out.push({ step: i, row: s.emit })
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
    rowClass(i) {
      const s = this.current
      return s && s.outer === i ? ['cur', s.state] : ''
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
.sd {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.sd-sql {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.sd-sql code,
.sd-innersql code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.sd-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.sd-box {
  flex: 1 1 260px;
  min-width: 0;
}
.sd-cap {
  margin: 4px 0;
  font-weight: 600;
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

.sd-panel {
  padding: 6px 10px;
  border: 1px dashed rgba(128, 128, 128, 0.5);
  border-radius: 6px;
  transition: box-shadow 0.3s, border-color 0.3s;
}
.sd-panel.pulse {
  border-color: #4285f4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.3);
}
.sd-innersql {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.sd-label {
  margin: 8px 0 4px;
  opacity: 0.75;
}
.sd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 26px;
}
.chip {
  padding: 1px 10px;
  border: 1px solid #4285f4;
  border-radius: 12px;
  background: rgba(66, 133, 244, 0.15);
}
.chip.nul {
  border-color: #e8890c;
  background: rgba(232, 137, 12, 0.18);
  color: #e8890c;
  font-style: italic;
}
.chip.empty {
  border-color: rgba(128, 128, 128, 0.5);
  background: transparent;
  opacity: 0.6;
}

.sd-status {
  margin: 10px 0;
  padding: 8px 10px;
  min-height: 2.6em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.sd-status.ok {
  border-color: #3eaf7c;
}
.sd-status.bad {
  border-color: #e64646;
}
.sd-status.warn {
  border-color: #e8890c;
}
.sd-status.inner {
  border-color: #4285f4;
}

.sd-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.sd-ctrl button,
.sd-ctrl select {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.sd-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.sd-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.sd-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sd-ctrl select option {
  color: #333;
}
.sd-range {
  flex: 1 1 100px;
  min-width: 80px;
  accent-color: #3eaf7c;
}
.sd-count {
  font-weight: 400;
  opacity: 0.75;
}

.sd-result {
  max-height: 240px;
  overflow: auto;
}
.sd-empty {
  padding: 8px;
  text-align: center;
  opacity: 0.5;
}
tr.latest td {
  background: rgba(62, 175, 124, 0.22);
}
.fly-enter-active {
  transition: all 0.4s;
}
.fly-enter {
  opacity: 0;
  transform: translateY(-10px);
}

.sd-legend {
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
.dot.inner {
  background: #4285f4;
}
</style>
