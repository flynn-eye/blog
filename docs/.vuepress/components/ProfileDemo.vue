<template>
  <div class="pr">
    <div class="pr-title"><code>show profiles</code>(示意数据)</div>
    <table class="pr-list">
      <thead>
        <tr>
          <th>Query_ID</th>
          <th>Duration</th>
          <th>Query</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="q in QUERIES"
          :key="q.id"
          :class="{ on: q.id === sel }"
          @click="select(q.id)"
        >
          <td>{{ q.id }}</td>
          <td>{{ q.duration.toFixed(8) }}</td>
          <td class="q">{{ q.sql }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pr-hint">👆 点一行,相当于执行 <code>show profile for query {{ sel }};</code></div>

    <div class="pr-stages">
      <div v-for="s in stages" :key="s.name" class="pr-row">
        <span class="pr-name">{{ s.name }}</span>
        <span class="pr-track">
          <span :class="['pr-fill', { hot: s.hot }]" :style="{ width: s.pct + '%' }"></span>
        </span>
        <span class="pr-val">{{ s.dur.toFixed(6) }}s<small>{{ s.pctText }}</small></span>
      </div>
    </div>

    <div class="pr-note">{{ current.note }}</div>
  </div>
</template>

<script>
const QUERIES = [
  {
    id: 1,
    sql: "select * from tb_user where phone = '17799990015'  -- phone 无索引",
    stages: {
      starting: 0.00012,
      'checking permissions': 0.00001,
      'Opening tables': 0.00003,
      init: 0.00005,
      'System lock': 0.00001,
      optimizing: 0.00002,
      statistics: 0.00004,
      preparing: 0.00003,
      executing: 0.00001,
      'Sending data': 0.84175,
      end: 0.00001,
      'query end': 0.00001,
      'closing tables': 0.00001,
      'freeing items': 0.00005,
      'cleaning up': 0.00002
    },
    note: '几乎所有时间都花在 Sending data 上。这个状态的名字有误导性:它并不只是"发送数据",而是 "读取并处理行(再发给客户端)"。全表扫描时,这一项会被拉得非常大。'
  },
  {
    id: 2,
    sql: "select * from tb_user where phone = '17799990015'  -- 已建 idx_user_phone",
    stages: {
      starting: 0.00011,
      'checking permissions': 0.00001,
      'Opening tables': 0.00003,
      init: 0.00004,
      'System lock': 0.00001,
      optimizing: 0.00002,
      statistics: 0.00006,
      preparing: 0.00003,
      executing: 0.00001,
      'Sending data': 0.00014,
      end: 0.00001,
      'query end': 0.00001,
      'closing tables': 0.00001,
      'freeing items': 0.00004,
      'cleaning up': 0.00002
    },
    note: '同一条 SQL,加了索引之后 Sending data 从近一秒降到了不到一毫秒。其他阶段本来就很小,基本不变——说明瓶颈确实在"读行"这一步,而不是解析、优化器或者权限检查。'
  },
  {
    id: 3,
    sql: 'select * from tb_user order by age  -- age 无索引',
    stages: {
      starting: 0.00013,
      'checking permissions': 0.00001,
      'Opening tables': 0.00003,
      init: 0.00005,
      'System lock': 0.00001,
      optimizing: 0.00002,
      statistics: 0.00004,
      preparing: 0.00003,
      executing: 0.00001,
      'Sending data': 0.92,
      'Creating sort index': 2.21,
      end: 0.00001,
      'query end': 0.00001,
      'closing tables': 0.00001,
      'freeing items': 0.00005,
      'cleaning up': 0.00002
    },
    note: '除了读行,又多出了一个很大的 Creating sort index(旧版本里叫 Sorting result),这就是 explain 里 Using filesort 的代价。'
  }
]

// show profiles 里的 Duration 是各阶段之和
QUERIES.forEach(q => {
  q.duration = Object.keys(q.stages).reduce((a, k) => a + q.stages[k], 0)
})

export default {
  name: 'ProfileDemo',
  data() {
    return { QUERIES, sel: 1 }
  },
  computed: {
    current() {
      return QUERIES.find(q => q.id === this.sel)
    },
    stages() {
      const entries = Object.keys(this.current.stages).map(name => ({ name, dur: this.current.stages[name] }))
      const total = entries.reduce((a, b) => a + b.dur, 0)
      const max = Math.max.apply(null, entries.map(e => e.dur))
      return entries.map(e => ({
        name: e.name,
        dur: e.dur,
        pct: Math.max(0.5, (e.dur / max) * 100),
        pctText: ' (' + ((e.dur / total) * 100).toFixed(1) + '%)',
        hot: e.dur / total > 0.3
      }))
    }
  },
  methods: {
    select(id) {
      this.sel = id
    }
  }
}
</script>

<style scoped>
.pr {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.pr-title {
  margin-bottom: 6px;
  font-weight: 600;
}
.pr-list {
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  display: table;
}
.pr-list th,
.pr-list td {
  padding: 3px 8px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  background: transparent;
  text-align: left;
}
.pr-list th {
  background: rgba(128, 128, 128, 0.18);
}
.pr-list tbody tr {
  cursor: pointer;
}
.pr-list tbody tr:hover td {
  background: rgba(128, 128, 128, 0.12);
}
.pr-list tbody tr.on td {
  background: rgba(62, 175, 124, 0.25);
}
.pr-list td.q {
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.pr-hint {
  margin: 6px 0 10px;
  opacity: 0.75;
  font-size: 12px;
}
.pr-hint code {
  background: none;
  padding: 0;
  color: inherit;
}
.pr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.pr-name {
  flex: 0 0 140px;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  text-align: right;
}
.pr-track {
  flex: 1;
  height: 12px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.12);
  overflow: hidden;
}
.pr-fill {
  display: block;
  height: 100%;
  border-radius: 6px;
  background: #4285f4;
  transition: width 0.5s ease;
}
.pr-fill.hot {
  background: #e64646;
}
.pr-val {
  flex: 0 0 150px;
  font-size: 12px;
  white-space: nowrap;
}
.pr-val small {
  opacity: 0.7;
}
.pr-note {
  margin-top: 10px;
  padding: 8px 10px;
  border-left: 4px solid #e8890c;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
@media (max-width: 600px) {
  .pr-name {
    flex-basis: 96px;
  }
  .pr-val {
    flex-basis: 110px;
  }
}
</style>
