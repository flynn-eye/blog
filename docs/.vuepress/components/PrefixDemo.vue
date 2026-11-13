<template>
  <div class="pf">
    <div class="pf-title">联合索引 <code>idx_pro_age_status (profession, age, status)</code> 能用到几列?</div>

    <div class="pf-conds">
      <div v-for="(c, i) in cols" :key="c.name" class="pf-cond">
        <code>{{ c.name }}</code>
        <select v-model="c.op">
          <option value="">不出现在 where 里</option>
          <option value="=">=(等值)</option>
          <option value=">">&gt;(范围)</option>
          <option value=">=">&gt;=(范围,含边界)</option>
        </select>
        <span :class="['badge', result.items[i].state]">{{ result.items[i].label }}</span>
      </div>
    </div>

    <div class="pf-sql">
      <code>{{ sql }}</code>
    </div>

    <div class="pf-bar">
      <span v-for="(c, i) in cols" :key="c.name" :class="['seg', result.items[i].state]">{{ c.name }}</span>
    </div>

    <div :class="['pf-res', result.used === 0 ? 'bad' : 'ok']">
      {{ result.summary }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrefixDemo',
  data() {
    return {
      cols: [
        { name: 'profession', op: '=' },
        { name: 'age', op: '=' },
        { name: 'status', op: '=' }
      ]
    }
  },
  computed: {
    sql() {
      const conds = this.cols.filter(c => c.op).map(c => {
        const v = c.name === 'profession' ? "'软件工程'" : c.name === 'age' ? '30' : "'0'"
        return `${c.name} ${c.op} ${v}`
      })
      return 'select * from tb_user' + (conds.length ? ' where ' + conds.join(' and ') : '') + ';'
    },
    result() {
      let used = 0
      let broken = false
      let reason = ''
      const items = this.cols.map((c, i) => {
        if (broken) {
          return { state: 'no', label: '✘ ' + reason }
        }
        if (!c.op) {
          broken = true
          reason = i === 0 ? '最左列缺失,整个索引都用不上' : `中间的 ${c.name} 缺失,它右边的列用不上`
          return { state: 'no', label: '✘ 未使用(没有条件)' }
        }
        used += 1
        if (c.op === '>') {
          broken = true
          reason = `${c.name} 是 > 范围查询,右边的列无法再缩小索引扫描范围`
          return { state: 'ok', label: '✔ 使用(范围)' }
        }
        return { state: 'ok', label: '✔ 使用' }
      })
      const summary =
        used === 0
          ? '一列都用不上索引:最左前缀法则要求查询必须从联合索引的最左列开始,并且不能跳过中间的列。'
          : `用到了联合索引的前 ${used} 列(explain 的 key_len 会随之变化)。`
      return { items, used, summary }
    }
  }
}
</script>

<style scoped>
.pf {
  margin: 1.2rem 0;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}
.pf-title {
  margin-bottom: 8px;
  font-weight: 600;
}
.pf-cond {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.pf-cond code {
  min-width: 82px;
}
select {
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
.badge {
  padding: 0 10px;
  border-radius: 10px;
  font-size: 12px;
}
.badge.ok {
  background: rgba(62, 175, 124, 0.25);
  color: #3eaf7c;
}
.badge.no {
  background: rgba(230, 70, 70, 0.18);
  color: #e64646;
}
.pf-sql {
  margin: 8px 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.14);
  overflow-x: auto;
  white-space: nowrap;
}
.pf-sql code {
  font-family: Menlo, Consolas, monospace;
  background: none;
  padding: 0;
  color: inherit;
}
.pf-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.seg {
  flex: 1;
  padding: 4px 0;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  text-align: center;
  font-family: Menlo, Consolas, monospace;
  transition: background 0.2s;
}
.seg.ok {
  border-color: #3eaf7c;
  background: rgba(62, 175, 124, 0.35);
}
.seg.no {
  opacity: 0.45;
}
.pf-res {
  padding: 8px 10px;
  border-left: 4px solid;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.1);
}
.pf-res.ok {
  border-color: #3eaf7c;
}
.pf-res.bad {
  border-color: #e64646;
}
</style>
