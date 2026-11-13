<template>
  <div class="tx">
    <div class="tx-top">
      <b>{{ sc.title }}</b>
      <label v-if="sc.showLevel" class="tx-level">
        隔离级别
        <select v-model="lv">
          <option v-for="(name, key) in LEVELS" :key="key" :value="key">{{ name }}</option>
        </select>
      </label>
    </div>

    <!-- 时间线:会话泳道 -->
    <div class="tx-lanes">
      <div class="tx-row tx-head" :style="gridStyle">
        <div class="a">会话 A</div>
        <div v-if="sc.lanes === 2" class="b">会话 B</div>
      </div>
      <transition-group name="fly" tag="div">
        <div v-for="(e, i) in shown" :key="i" class="tx-row" :style="gridStyle">
          <div v-for="lane in laneList" :key="lane" class="tx-cell">
            <div v-if="e.lane === lane" :class="['card', e.state, e.kind, { now: i === cur }]">
              <span class="t">t{{ i + 1 }}</span>
              <code>{{ e.sql }}</code>
              <div v-if="e.state === 'blocked'" class="blk">⏳ {{ e.tip }}</div>
              <div v-if="e.result" class="res">→ {{ e.result }}</div>
              <div v-if="e.flag" class="badge">{{ FLAG[e.flag] }}</div>
            </div>
          </div>
        </div>
      </transition-group>
      <div v-if="!shown.length" class="tx-empty">(点击「播放」或「下一步」开始)</div>
    </div>

    <!-- 当前步骤说明 -->
    <div :class="['tx-status', statusClass]">{{ status }}</div>

    <!-- 控制条 -->
    <div class="tx-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <input class="tx-range" type="range" :min="-1" :max="last" v-model.number="cur" @input="pause" />
      <span class="tx-count">{{ cur + 1 }} / {{ events.length }}</span>
      <select v-model.number="speed">
        <option :value="1800">慢速</option>
        <option :value="1100">中速</option>
        <option :value="450">快速</option>
      </select>
    </div>

    <!-- 数据库状态 -->
    <div class="tx-db">
      <div class="tx-cap">数据库中已提交的数据:account 表</div>
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>name</th>
            <th>balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in dbRows" :key="row.id" :class="{ changed: row.changed }">
            <td>{{ row.id }}</td>
            <td>{{ row.name }}</td>
            <td>{{ row.balance }}</td>
          </tr>
        </tbody>
      </table>
      <div class="tx-chips">
        <span v-for="(p, i) in pendings" :key="'p' + i" class="chip pend">{{ p }}</span>
        <span v-for="(l, i) in lockList" :key="'l' + i" class="chip lock">🔒 {{ l }}</span>
        <span v-if="!pendings.length && !lockList.length" class="chip none">没有未提交的修改</span>
      </div>
    </div>
  </div>
</template>

<script>
const LEVELS = {
  RU: 'READ UNCOMMITTED(读未提交)',
  RC: 'READ COMMITTED(读已提交)',
  RR: 'REPEATABLE READ(可重复读,默认)',
  S: 'SERIALIZABLE(串行化)'
}
const FLAG = { dirty: '⚠ 脏读', nonrepeatable: '⚠ 不可重复读', phantom: '⚠ 幻读' }

const ACCOUNTS = [
  { id: 1, name: '张三', balance: 1000 },
  { id: 2, name: '李四', balance: 1000 }
]
const clone = rows => rows.map(r => ({ ...r }))
const byId = (rows, id) => rows.find(r => r.id === id)
const balanceOf = id => rows => 'balance = ' + byId(rows, id).balance
const count = rows => 'count = ' + rows.length

const set = (id, v) => rows => {
  byId(rows, id).balance = v
}
const add = (id, d) => rows => {
  byId(rows, id).balance += d
}

const GENERIC = {
  begin: '开启事务',
  read: '执行查询',
  write: '修改数据(未提交,只暂存在本事务里)',
  commit: '提交事务:本事务的修改正式生效',
  rollback: '回滚事务:本事务的所有修改作废'
}

const SCENARIOS = {
  dirty: {
    title: '脏读:读到了别人还没提交的数据',
    lanes: 2,
    showLevel: true,
    intro: '张三账户余额 1000。会话 B 要修改它但最终会回滚,看看会话 A 能读到什么。',
    steps: [
      { who: 'A', kind: 'begin', sql: 'begin;' },
      { who: 'B', kind: 'begin', sql: 'begin;' },
      {
        who: 'B',
        kind: 'write',
        sql: 'update account set balance = 0 where id = 1;',
        res: 'r1',
        op: set(1, 0),
        desc: 'B 未提交:张三 balance → 0',
        tip: 'B 把张三的余额改成 0,但还没有提交'
      },
      { who: 'A', kind: 'read', sql: 'select balance from account where id = 1;', res: 'r1', query: balanceOf(1) },
      { who: 'B', kind: 'rollback', sql: 'rollback;', tip: 'B 回滚了:张三的余额其实从来没有变过' },
      { who: 'A', kind: 'read', sql: 'select balance from account where id = 1;', res: 'r1', query: balanceOf(1) },
      { who: 'A', kind: 'commit', sql: 'commit;' }
    ],
    problem: 'dirty',
    explain: {
      RU: '⚠ A 读到了 B 尚未提交、随后又回滚的 0。这是一个根本不存在于数据库里的"脏数据"。',
      RC: '✔ 只能读到已提交的数据,脏读被避免了。',
      RR: '✔ 只能读到已提交的数据,脏读被避免了。',
      S: '✔ B 修改时持有排他锁,A 的查询被阻塞,直到 B 回滚后才读到真实的 1000。'
    }
  },
  nonrepeatable: {
    title: '不可重复读:同一事务里两次读同一行,结果不一样',
    lanes: 2,
    showLevel: true,
    intro: '会话 A 在一个事务里读两次张三的余额,中间会话 B 修改并提交了它。',
    steps: [
      { who: 'A', kind: 'begin', sql: 'begin;' },
      { who: 'A', kind: 'read', sql: 'select balance from account where id = 1;', res: 'r1', query: balanceOf(1), tip: 'A 第一次读取' },
      { who: 'B', kind: 'begin', sql: 'begin;' },
      {
        who: 'B',
        kind: 'write',
        sql: 'update account set balance = 500 where id = 1;',
        res: 'r1',
        op: set(1, 500),
        desc: 'B 未提交:张三 balance → 500',
        tip: 'B 把张三的余额改成 500'
      },
      { who: 'B', kind: 'commit', sql: 'commit;', tip: 'B 提交,余额 500 正式生效' },
      { who: 'A', kind: 'read', sql: 'select balance from account where id = 1;', res: 'r1', query: balanceOf(1), tip: 'A 第二次读取同一行' },
      { who: 'A', kind: 'commit', sql: 'commit;' }
    ],
    problem: 'nonrepeatable',
    explain: {
      RU: '⚠ 两次读取的结果不同(1000 → 500)。读未提交同样存在不可重复读(还有脏读)。',
      RC: '⚠ 不可重复读:每次查询都读最新的已提交数据,B 提交之后,A 第二次就读到了 500。',
      RR: '✔ A 第一次读取时生成快照,事务内后续的普通查询都读这份快照,两次都是 1000。',
      S: '✔ A 读取时加了共享锁,B 的 update 被阻塞,直到 A 提交之后才执行。A 两次读到的都是 1000。'
    }
  },
  phantom: {
    title: '幻读:同一个查询,第二次多出了几行',
    lanes: 2,
    showLevel: true,
    intro: '会话 A 在一个事务里统计两次账户数量,中间会话 B 新插入了一个账户并提交。',
    steps: [
      { who: 'A', kind: 'begin', sql: 'begin;' },
      { who: 'A', kind: 'read', sql: 'select * from account;', res: 'all', query: count, tip: 'A 第一次查询' },
      { who: 'B', kind: 'begin', sql: 'begin;' },
      {
        who: 'B',
        kind: 'write',
        sql: "insert into account values (3, '王五', 800);",
        res: 'all',
        op: rows => rows.push({ id: 3, name: '王五', balance: 800 }),
        desc: 'B 未提交:新增 王五',
        tip: 'B 插入一条新记录'
      },
      { who: 'B', kind: 'commit', sql: 'commit;', tip: 'B 提交,新记录正式生效' },
      { who: 'A', kind: 'read', sql: 'select * from account;', res: 'all', query: count, tip: 'A 第二次执行同样的查询' },
      { who: 'A', kind: 'commit', sql: 'commit;' }
    ],
    problem: 'phantom',
    explain: {
      RU: '⚠ 幻读:同一个查询,第二次多出了一行(2 → 3)。',
      RC: '⚠ 幻读:B 提交后,A 第二次查询看到了新插入的行(2 → 3)。',
      RR: '✔ 普通查询读的是快照,两次都是 2 行。(注意:如果 A 在事务里对这些行做了 update、select ... for update 等"当前读",新行仍然可能冒出来。)',
      S: '✔ A 的查询加了范围共享锁,B 的 insert 被阻塞,直到 A 提交后才插入。A 两次看到的都是 2 行。'
    }
  },
  transferCommit: {
    title: '事务的原子性:转账成功(commit)',
    lanes: 1,
    showLevel: false,
    intro: '张三给李四转账 500 元:两条 update 必须一起成功。',
    steps: [
      { who: 'A', kind: 'begin', sql: 'begin;', tip: '开启事务' },
      { who: 'A', kind: 'write', sql: "update account set balance = balance - 500 where name = '张三';", op: add(1, -500), desc: 'A 未提交:张三 balance - 500', tip: '张三扣 500(还没提交,数据库里的数据没变)' },
      { who: 'A', kind: 'write', sql: "update account set balance = balance + 500 where name = '李四';", op: add(2, 500), desc: 'A 未提交:李四 balance + 500', tip: '李四加 500(还没提交)' },
      { who: 'A', kind: 'commit', sql: 'commit;', tip: '提交:两条修改同时生效' }
    ],
    explain: '✔ 两条修改作为一个整体同时生效:张三 500、李四 1500,总额不变。'
  },
  transferRollback: {
    title: '事务的原子性:出错回滚(rollback)',
    lanes: 1,
    showLevel: false,
    intro: '同样是转账,这次第二步出错了。',
    steps: [
      { who: 'A', kind: 'begin', sql: 'begin;', tip: '开启事务' },
      { who: 'A', kind: 'write', sql: "update account set balance = balance - 500 where name = '张三';", op: add(1, -500), desc: 'A 未提交:张三 balance - 500', tip: '张三扣 500(还没提交)' },
      { who: 'A', kind: 'error', sql: '💥 第二条 update 执行出错(网络中断、账户不存在……)', tip: '程序捕获到异常,准备回滚' },
      { who: 'A', kind: 'rollback', sql: 'rollback;', tip: '回滚:张三那条未提交的修改全部作废' }
    ],
    explain: '✔ 回滚之后,张三的余额恢复成 1000,就像什么都没发生过。要么全部成功,要么全部失败。'
  },
  transferNoTx: {
    title: '对比:如果没有事务会怎样',
    lanes: 1,
    showLevel: false,
    intro: '不开启事务,每条 SQL 执行完就自动提交(autocommit)。',
    steps: [
      { who: 'A', kind: 'auto', sql: "update account set balance = balance - 500 where name = '张三';", op: add(1, -500), tip: '没有 begin,这条 update 执行完立刻自动提交,无法撤销' },
      { who: 'A', kind: 'error', sql: '💥 数据库连接中断,第二条 update 没有机会执行', tip: '程序在这里崩溃了' }
    ],
    explain: '✘ 张三的 500 元已经扣掉了,李四却没收到,500 元凭空消失,数据不一致。这就是需要事务的原因。'
  }
}

const overlap = (a, b) => a === b || a === 'all' || b === 'all'

function simulate(sc, level) {
  const committed = clone(ACCOUNTS)
  const pending = { A: [], B: [] }
  const locks = []
  const snapshot = { A: null, B: null }
  const first = {}
  const queue = { A: [], B: [] }
  const events = []

  const conflict = s => {
    if (level !== 'S' || !s.res) return null
    if (s.kind === 'read') return locks.find(l => l.who !== s.who && l.mode === 'X' && overlap(l.res, s.res)) || null
    if (s.kind === 'write') return locks.find(l => l.who !== s.who && overlap(l.res, s.res)) || null
    return null
  }
  const release = who => {
    for (let i = locks.length - 1; i >= 0; i--) if (locks[i].who === who) locks.splice(i, 1)
  }
  const snap = ev => {
    ev.db = clone(committed)
    ev.pending = [...pending.A, ...pending.B].map(p => p.desc)
    ev.locks = locks.map(l => `${l.who} 持有${l.mode === 'S' ? '共享锁' : '排他锁'}(${l.res === 'all' ? '整表/范围' : '张三这一行'})`)
    events.push(ev)
  }

  const exec = (s, resumed) => {
    const ev = {
      lane: s.who,
      sql: s.sql,
      kind: s.kind,
      state: resumed ? 'resume' : 'run',
      tip: (resumed ? '锁已释放,继续执行。' : '') + (s.tip || GENERIC[s.kind] || '')
    }
    if (s.kind === 'begin') {
      snapshot[s.who] = null
      first[s.who] = undefined
    } else if (s.kind === 'read') {
      let rows
      if (level === 'RU') {
        rows = clone(committed)
        ;[...pending.A, ...pending.B].forEach(p => p.op(rows))
      } else {
        if (level === 'RR') {
          if (!snapshot[s.who]) snapshot[s.who] = clone(committed)
          rows = clone(snapshot[s.who])
        } else {
          rows = clone(committed)
        }
        pending[s.who].forEach(p => p.op(rows))
      }
      const result = s.query(rows)
      ev.result = result
      if (level === 'S') locks.push({ who: s.who, mode: 'S', res: s.res })
      if (sc.problem === 'dirty') {
        if (result !== s.query(committed)) ev.flag = 'dirty'
      } else if (first[s.who] === undefined) {
        first[s.who] = result
      } else if (result !== first[s.who]) {
        ev.flag = sc.problem
      }
    } else if (s.kind === 'write') {
      pending[s.who].push({ op: s.op, desc: s.desc })
      if (level === 'S' && s.res) locks.push({ who: s.who, mode: 'X', res: s.res })
    } else if (s.kind === 'auto') {
      s.op(committed)
    } else if (s.kind === 'commit') {
      pending[s.who].forEach(p => p.op(committed))
      pending[s.who] = []
      release(s.who)
    } else if (s.kind === 'rollback') {
      pending[s.who] = []
      release(s.who)
    }
    snap(ev)
  }

  const drain = () => {
    let progress = true
    while (progress) {
      progress = false
      ;['A', 'B'].forEach(who => {
        if (queue[who].length && !conflict(queue[who][0])) {
          exec(queue[who].shift(), true)
          progress = true
        }
      })
    }
  }

  sc.steps.forEach(s => {
    const c = conflict(s)
    if (c || queue[s.who].length) {
      snap({
        lane: s.who,
        sql: s.sql,
        kind: s.kind,
        state: 'blocked',
        tip: c ? `被会话 ${c.who} 持有的锁阻塞,等待它提交或回滚……` : '前面的语句还在等待锁,这条只能排在它后面……'
      })
      queue[s.who].push(s)
    } else {
      exec(s, false)
    }
    drain()
  })
  return events
}

export default {
  name: 'TxDemo',
  props: {
    mode: { type: String, default: 'dirty' },
    level: { type: String, default: 'RR' }
  },
  data() {
    return { cur: -1, playing: false, speed: 1100, timer: null, lv: this.level, LEVELS, FLAG }
  },
  computed: {
    sc() {
      return SCENARIOS[this.mode] || SCENARIOS.dirty
    },
    laneList() {
      return this.sc.lanes === 2 ? ['A', 'B'] : ['A']
    },
    gridStyle() {
      return { gridTemplateColumns: `repeat(${this.laneList.length}, minmax(0, 1fr))` }
    },
    events() {
      return simulate(this.sc, this.sc.showLevel ? this.lv : 'RR')
    },
    last() {
      return this.events.length - 1
    },
    finished() {
      return this.cur >= this.last
    },
    shown() {
      return this.events.slice(0, this.cur + 1)
    },
    currentEvent() {
      return this.cur >= 0 ? this.events[this.cur] : null
    },
    status() {
      const e = this.currentEvent
      if (!e) return this.sc.intro
      if (this.finished) {
        const ex = this.sc.explain
        const t = typeof ex === 'string' ? ex : ex[this.lv]
        return `${t.charAt(0)} 执行完毕:${t.slice(1).trim()}`
      }
      let t = `会话 ${e.lane}:${e.tip}`
      if (e.result) t += `  → ${e.result}`
      if (e.flag) t += `  ${FLAG[e.flag]}:${this.flagText(e.flag)}`
      return t
    },
    statusClass() {
      const e = this.currentEvent
      if (!e) return 'idle'
      if (this.finished) {
        const ex = this.sc.explain
        const t = typeof ex === 'string' ? ex : ex[this.lv]
        return t.charAt(0) === '✔' ? 'ok' : 'bad'
      }
      if (e.flag || e.kind === 'error') return 'bad'
      if (e.state === 'blocked') return 'warn'
      return 'idle'
    },
    dbRows() {
      const e = this.currentEvent
      const rows = e ? e.db : ACCOUNTS
      const prev = this.cur > 0 ? this.events[this.cur - 1].db : ACCOUNTS
      return rows.map(r => {
        const p = byId(prev, r.id)
        return { ...r, changed: !p || p.balance !== r.balance }
      })
    },
    pendings() {
      return this.currentEvent ? this.currentEvent.pending : []
    },
    lockList() {
      return this.currentEvent ? this.currentEvent.locks : []
    }
  },
  watch: {
    lv() {
      this.reset()
    },
    mode() {
      this.reset()
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    flagText(flag) {
      return { dirty: 'A 读到了别人还没提交的数据', nonrepeatable: '同一事务内两次读取结果不一致', phantom: '同一查询第二次多出了行' }[flag]
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
.tx {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.tx-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.tx-level select,
.tx-ctrl select {
  margin-left: 4px;
  padding: 3px 8px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
}
.tx select option {
  color: #333;
}

.tx-lanes {
  padding: 8px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.07);
  min-height: 80px;
}
.tx-row {
  display: grid;
  gap: 8px;
  margin-bottom: 6px;
}
.tx-head {
  font-weight: 700;
  text-align: center;
}
.tx-head .a {
  color: #4285f4;
}
.tx-head .b {
  color: #e8890c;
}
.tx-cell {
  min-width: 0;
}
.card {
  padding: 5px 8px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-left-width: 4px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.08);
  transition: box-shadow 0.25s;
}
.card.now {
  box-shadow: 0 0 0 2px rgba(62, 175, 124, 0.7);
}
.card.blocked {
  border-style: dashed;
  opacity: 0.75;
}
.card.error {
  border-color: #e64646;
  background: rgba(230, 70, 70, 0.12);
}
.tx-lanes .card {
  border-left-color: #4285f4;
}
.tx-row .tx-cell:nth-child(2) .card {
  border-left-color: #e8890c;
}
.card .t {
  margin-right: 6px;
  opacity: 0.55;
  font-size: 11px;
}
.card code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
  word-break: break-all;
  white-space: pre-wrap;
}
.blk {
  color: #e8890c;
}
.res {
  margin-top: 2px;
  font-weight: 600;
  color: #3eaf7c;
}
.badge {
  display: inline-block;
  margin-top: 2px;
  padding: 0 8px;
  border-radius: 8px;
  background: #e64646;
  color: #fff;
  font-size: 12px;
}
.tx-empty {
  padding: 16px;
  text-align: center;
  opacity: 0.5;
}

.tx-status {
  margin: 10px 0;
  padding: 8px 10px;
  min-height: 2.6em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.tx-status.ok {
  border-color: #3eaf7c;
}
.tx-status.bad {
  border-color: #e64646;
}
.tx-status.warn {
  border-color: #e8890c;
}

.tx-ctrl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.tx-ctrl button {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.tx-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.tx-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.tx-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tx-range {
  flex: 1 1 100px;
  min-width: 80px;
  accent-color: #3eaf7c;
}
.tx-count {
  opacity: 0.75;
}

.tx-cap {
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
  background: transparent;
}
th {
  background: rgba(128, 128, 128, 0.18);
}
tr.changed td {
  background: rgba(62, 175, 124, 0.3) !important;
}
.tx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.chip {
  padding: 1px 10px;
  border-radius: 12px;
  border: 1px solid;
}
.chip.pend {
  border-color: #e8890c;
  background: rgba(232, 137, 12, 0.15);
}
.chip.lock {
  border-color: #4285f4;
  background: rgba(66, 133, 244, 0.15);
}
.chip.none {
  border-color: rgba(128, 128, 128, 0.5);
  opacity: 0.6;
}
.fly-enter-active {
  transition: all 0.35s;
}
.fly-enter {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
