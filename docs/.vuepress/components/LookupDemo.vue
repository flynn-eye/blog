<template>
  <div class="lk">
    <div class="lk-sql"><code>{{ cfg.sql }}</code></div>

    <div class="lk-grid">
      <!-- 二级索引 -->
      <div :class="['lk-box', { dim: cfg.noSecondary }]">
        <div class="lk-cap">二级索引 idx_name<small>(叶子节点:name + 主键 id)</small></div>
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th>id(主键)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in SECONDARY" :key="r.id" :class="rowCls('sec', i)">
              <td>{{ r.name }}</td>
              <td>{{ r.id }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 聚集索引 -->
      <div class="lk-box">
        <div class="lk-cap">聚集索引(主键)<small>(叶子节点:整行数据)</small></div>
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>name</th>
              <th>age</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in ROWS" :key="r.id" :class="rowCls('cl', i)">
              <td>{{ r.id }}</td>
              <td>{{ r.name }}</td>
              <td>{{ r.age }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div :class="['lk-status', current ? current.state : 'idle']">
      <template v-if="finished">✔ 执行完毕:{{ cfg.finalNote }}</template>
      <template v-else-if="current">{{ current.text }}</template>
      <template v-else>{{ cfg.intro }}</template>
    </div>

    <div class="lk-cost">
      <span class="pill">已查找 {{ current ? current.trees : 0 }} 棵 B+ 树</span>
      <span v-if="current && current.result" class="lk-res">返回:{{ current.result }}</span>
    </div>

    <div class="lk-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="cur < 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="finished" title="下一步">▶|</button>
      <span class="lk-count">{{ cur + 1 }} / {{ cfg.steps.length }}</span>
    </div>
  </div>
</template>

<script>
const ROWS = [
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 },
  { id: 3, name: '王五', age: 28 },
  { id: 4, name: '赵六', age: 35 },
  { id: 5, name: '钱七', age: 22 },
  { id: 6, name: '孙八', age: 28 }
]
// 二级索引按 name 排序(拼音:李 钱 孙 王 张 赵)
const SECONDARY = [2, 5, 6, 3, 1, 4].map(id => ({ id, name: ROWS.find(r => r.id === id).name }))

const CFG = {
  primary: {
    sql: 'select * from tb_user where id = 3;',
    intro: '按主键查询:直接走聚集索引。点击「播放」开始。',
    noSecondary: true,
    finalNote: '聚集索引的叶子节点就是整行数据,只查一棵 B+ 树,没有回表。',
    steps: [
      { cl: 2, state: 'ok', trees: 1, text: '在聚集索引(主键 B+ 树)中查找 id = 3,叶子节点里直接就是整行数据', result: '3 | 王五 | 28' }
    ]
  },
  backtable: {
    sql: "select * from tb_user where name = '王五';",
    intro: "按 name 查询,而且要 select *:先走二级索引,再回表。点击「播放」开始。",
    finalNote: '先查二级索引拿到主键值,再用主键值回到聚集索引取整行,一共查了两棵 B+ 树。这个"再查一次"的过程就叫回表。',
    steps: [
      { sec: 3, state: 'plain', trees: 1, text: "第 1 步:在二级索引 idx_name 中查找 name = '王五'。二级索引的叶子节点只存了 name 和主键 id,找到 (王五, id = 3)" },
      { sec: 3, cl: 2, state: 'warn', trees: 2, text: '第 2 步(回表):select * 还需要 age 等其他字段,二级索引里没有,只能拿着 id = 3 回到聚集索引再查一次,取出整行', result: '3 | 王五 | 28' }
    ]
  },
  covering: {
    sql: "select id, name from tb_user where name = '王五';",
    intro: '只查 id 和 name:这两列二级索引里本来就有。点击「播放」开始。',
    finalNote: '需要的列全都在二级索引里,不需要回表,只查一棵 B+ 树。这就是覆盖索引(explain 的 Extra 显示 Using index)。',
    steps: [
      { sec: 3, state: 'ok', trees: 1, text: "在二级索引 idx_name 中找到 (王五, id = 3)。查询要的 id、name 都在索引里,直接返回,无需回表", result: '3 | 王五' }
    ]
  }
}

export default {
  name: 'LookupDemo',
  props: { mode: { type: String, default: 'backtable' } },
  data() {
    return { cur: -1, playing: false, timer: null, ROWS, SECONDARY }
  },
  computed: {
    cfg() {
      return CFG[this.mode] || CFG.backtable
    },
    last() {
      return this.cfg.steps.length - 1
    },
    current() {
      return this.cur >= 0 ? this.cfg.steps[this.cur] : null
    },
    finished() {
      return this.cur >= this.last
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
    rowCls(kind, i) {
      const s = this.current
      if (!s) return ''
      if (kind === 'sec' && s.sec === i) return ['cur', s.state === 'warn' ? 'ok' : s.state]
      if (kind === 'cl' && s.cl === i) return ['cur', s.state]
      return ''
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
      this.timer = setTimeout(this.advance, 1800)
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
.lk {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.lk-sql {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.lk-sql code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.lk-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.lk-box {
  flex: 1 1 220px;
  min-width: 0;
}
.lk-box.dim {
  opacity: 0.35;
}
.lk-cap {
  margin: 4px 0;
  font-weight: 600;
}
.lk-cap small {
  margin-left: 4px;
  font-weight: 400;
  opacity: 0.7;
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
tr.cur.ok td {
  background: rgba(62, 175, 124, 0.35) !important;
}
tr.cur.plain td {
  background: rgba(66, 133, 244, 0.3) !important;
}
tr.cur.warn td {
  background: rgba(232, 137, 12, 0.35) !important;
}
.lk-status {
  margin: 10px 0;
  padding: 8px 10px;
  min-height: 2.6em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.lk-status.ok {
  border-color: #3eaf7c;
}
.lk-status.plain {
  border-color: #4285f4;
}
.lk-status.warn {
  border-color: #e8890c;
}
.lk-cost {
  margin-bottom: 8px;
}
.pill {
  display: inline-block;
  padding: 1px 12px;
  border-radius: 12px;
  background: #4285f4;
  color: #fff;
}
.lk-res {
  margin-left: 10px;
  font-weight: 600;
  color: #3eaf7c;
}
.lk-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}
.lk-ctrl button {
  padding: 3px 10px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.lk-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.lk-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.lk-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.lk-count {
  opacity: 0.75;
}
</style>
