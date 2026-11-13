<template>
  <div class="ex">
    <div class="ex-tabs">
      <button
        v-for="(s, k) in scenes"
        :key="k"
        :class="{ on: k === sceneKey }"
        @click="sceneKey = k"
      >{{ s.title }}</button>
    </div>

    <div class="ex-sql"><code>{{ scene.sql }}</code></div>

    <div class="ex-label">
      <span :class="['tag', phase >= 3 ? 'good' : 'bad']">{{ phase >= 3 ? '优化后' : '优化前' }}</span>
      <code>explain</code> 的结果
    </div>
    <div class="ex-scroll">
      <table class="ex-table">
        <thead>
          <tr>
            <th v-for="c in COLS" :key="c">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td v-for="c in COLS" :key="c" :class="cellCls(c)">{{ show(plan[c]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="ex-rows">
      <div class="ex-rows-cap">需要读取的行数(估算 rows,对数刻度)</div>
      <div class="ex-bar-wrap">
        <div :class="['ex-bar', phase >= 3 ? 'good' : 'bad']" :style="{ width: barWidth + '%' }"></div>
        <span class="ex-bar-num">{{ plan.rows.toLocaleString() }}</span>
      </div>
    </div>

    <div :class="['ex-status', statusCls]">
      <template v-if="phase === 0">{{ scene.intro }}</template>
      <template v-else-if="phase === 1">
        <b>诊断:</b>{{ scene.diagnosis }}
      </template>
      <template v-else-if="phase === 2">
        <b>优化:</b><code>{{ scene.fix }}</code>
      </template>
      <template v-else>
        <b>再次 explain:</b>{{ scene.result }}
      </template>
    </div>

    <div class="ex-ctrl">
      <button @click="reset" title="重置">⏮</button>
      <button @click="prev" :disabled="phase === 0" title="上一步">◀</button>
      <button class="main" @click="toggle">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
      <button @click="next" :disabled="phase === 3" title="下一步">▶|</button>
      <span class="ex-count">{{ phase + 1 }} / 4</span>
    </div>
  </div>
</template>

<script>
const COLS = ['id', 'select_type', 'table', 'type', 'possible_keys', 'key', 'key_len', 'rows', 'filtered', 'Extra']

// bad: 需要标红的字段;good: 需要标绿的字段
const SCENES = {
  phone: {
    title: '全表扫描',
    sql: "select * from tb_user where phone = '17799990015';",
    intro: '假设 tb_user 有近 100 万行,phone 上还没有索引。点击「播放」看看 explain 怎么说。',
    diagnosis: 'type = ALL 是全表扫描,key 为 NULL 说明没有索引可用,rows 接近 100 万——为了找一行,把整张表翻了一遍。',
    fix: 'create unique index idx_user_phone on tb_user(phone);',
    result: 'type 变成 const(唯一索引等值查询),key 用上了新索引,rows 只剩 1。',
    before: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'ALL', possible_keys: null, key: null, key_len: null, rows: 996742, filtered: '10.00', Extra: 'Using where' },
    after: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'const', possible_keys: 'idx_user_phone', key: 'idx_user_phone', key_len: '46', rows: 1, filtered: '100.00', Extra: null },
    badBefore: ['type', 'key', 'rows'],
    goodAfter: ['type', 'key', 'rows']
  },
  order: {
    title: 'filesort 排序',
    sql: 'select id, age, phone from tb_user order by age, phone;',
    intro: '按 age、phone 排序,表上没有对应的索引。点击「播放」。',
    diagnosis: 'Extra 里的 Using filesort 说明排序没法利用索引,要把数据读出来后在 sort buffer(放不下就借助磁盘临时文件)里重新排序。数据量一大,这一步非常慢。',
    fix: 'create index idx_age_phone on tb_user(age, phone);',
    result: '索引本身就是按 (age, phone) 有序的,直接顺着索引读就是排好序的结果;Using filesort 消失,并且因为要查的 id、age、phone 全在索引里,还变成了覆盖索引(Using index)。',
    before: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'ALL', possible_keys: null, key: null, key_len: null, rows: 996742, filtered: '100.00', Extra: 'Using filesort' },
    after: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'index', possible_keys: null, key: 'idx_age_phone', key_len: '51', rows: 996742, filtered: '100.00', Extra: 'Using index' },
    badBefore: ['type', 'key', 'Extra'],
    goodAfter: ['key', 'Extra']
  },
  group: {
    title: '临时表分组',
    sql: 'select profession, count(*) from tb_user group by profession;',
    intro: '按 profession 分组统计,表上没有合适的索引。点击「播放」。',
    diagnosis: 'Extra 里的 Using temporary 说明 MySQL 要建一张临时表来做分组统计。临时表可能落到磁盘上,是 group by 慢的常见原因。',
    fix: 'create index idx_pro_age_sta on tb_user(profession, age, status);',
    result: '索引里 profession 本来就是排好序的,相同值挨在一起,边扫边数就行,不再需要临时表。注意 rows 仍然是全部——只是读的是更小的索引,而不是整张表。',
    before: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'ALL', possible_keys: null, key: null, key_len: null, rows: 996742, filtered: '100.00', Extra: 'Using temporary' },
    after: { id: 1, select_type: 'SIMPLE', table: 'tb_user', type: 'index', possible_keys: 'idx_pro_age_sta', key: 'idx_pro_age_sta', key_len: '212', rows: 996742, filtered: '100.00', Extra: 'Using index' },
    badBefore: ['type', 'key', 'Extra'],
    goodAfter: ['key', 'Extra']
  }
}

export default {
  name: 'ExplainDemo',
  data() {
    return { COLS, scenes: SCENES, sceneKey: 'phone', phase: 0, playing: false, timer: null }
  },
  computed: {
    scene() {
      return SCENES[this.sceneKey]
    },
    plan() {
      return this.phase >= 3 ? this.scene.after : this.scene.before
    },
    statusCls() {
      return ['idle', 'bad', 'plain', 'good'][this.phase]
    },
    barWidth() {
      // 对数刻度:1 行 ≈ 4%,100 万行 = 100%
      const r = Math.max(1, this.plan.rows)
      return Math.max(4, (Math.log10(r) / 6) * 100)
    }
  },
  watch: {
    sceneKey() {
      this.reset()
    }
  },
  beforeDestroy() {
    this.pause()
  },
  methods: {
    show(v) {
      return v === null || v === undefined ? 'NULL' : v
    },
    cellCls(c) {
      if (this.phase === 0 || this.phase === 1) {
        return this.phase === 1 && this.scene.badBefore.indexOf(c) >= 0 ? 'bad' : ''
      }
      if (this.phase === 3 && this.scene.goodAfter.indexOf(c) >= 0) return 'good'
      return ''
    },
    toggle() {
      this.playing ? this.pause() : this.play()
    },
    play() {
      if (this.phase >= 3) this.phase = 0
      this.playing = true
      this.advance()
    },
    advance() {
      clearTimeout(this.timer)
      if (this.phase < 3) this.phase += 1
      if (this.phase >= 3) {
        this.playing = false
        return
      }
      this.timer = setTimeout(this.advance, 2600)
    },
    pause() {
      clearTimeout(this.timer)
      this.playing = false
    },
    next() {
      this.pause()
      if (this.phase < 3) this.phase += 1
    },
    prev() {
      this.pause()
      if (this.phase > 0) this.phase -= 1
    },
    reset() {
      this.pause()
      this.phase = 0
    }
  }
}
</script>

<style scoped>
.ex {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.ex-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.ex-tabs button,
.ex-ctrl button {
  padding: 3px 12px;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.ex-tabs button.on {
  border-color: #3eaf7c;
  background: rgba(62, 175, 124, 0.22);
  color: #3eaf7c;
}
.ex-ctrl button.main {
  border-color: #3eaf7c;
  color: #3eaf7c;
}
.ex-ctrl button:hover:not(:disabled) {
  background: rgba(62, 175, 124, 0.18);
}
.ex-ctrl button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ex-sql {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.ex-sql code,
.ex-status code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.ex-label {
  margin: 10px 0 4px;
}
.tag {
  display: inline-block;
  margin-right: 4px;
  padding: 0 10px;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
}
.tag.bad {
  background: #e64646;
}
.tag.good {
  background: #3eaf7c;
}
.ex-scroll {
  overflow-x: auto;
}
.ex-table {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  display: table;
  white-space: nowrap;
}
.ex-table th,
.ex-table td {
  padding: 3px 8px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  text-align: center;
  background: transparent;
  transition: background 0.3s;
}
.ex-table th {
  background: rgba(128, 128, 128, 0.18);
}
.ex-table td.bad {
  background: rgba(230, 70, 70, 0.28);
  font-weight: 600;
}
.ex-table td.good {
  background: rgba(62, 175, 124, 0.3);
  font-weight: 600;
}
.ex-rows {
  margin: 10px 0;
}
.ex-rows-cap {
  opacity: 0.75;
  font-size: 12px;
}
.ex-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ex-bar {
  height: 14px;
  border-radius: 7px;
  transition: width 0.6s ease, background 0.3s;
}
.ex-bar.bad {
  background: #e64646;
}
.ex-bar.good {
  background: #3eaf7c;
}
.ex-bar-num {
  font-weight: 600;
  white-space: nowrap;
}
.ex-status {
  margin: 8px 0;
  padding: 8px 10px;
  min-height: 3em;
  border-left: 4px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.ex-status.bad {
  border-color: #e64646;
}
.ex-status.plain {
  border-color: #4285f4;
}
.ex-status.good {
  border-color: #3eaf7c;
}
.ex-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ex-count {
  opacity: 0.75;
}
</style>
