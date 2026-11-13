---

title: mysql性能分析与优化

meta:
  - name: description
    content: mysql性能分析与优化
  - name: keywords
    content: mysql,性能优化,慢查询日志,show profile,explain,执行计划,order by,group by,limit,count

created: 2026/11/04

updated: 2026/11/04
 
tags:

---

## 先看全局:优化应该怎么入手

SQL 慢了,最忌讳的是"凭感觉"加索引。一个靠谱的优化流程是:

1. **发现**:哪些 SQL 慢?(执行频率、慢查询日志、`show processlist`)
2. **定位**:这条 SQL 慢在哪?(`show profile`、`explain`、优化器跟踪)
3. **优化**:加索引、改写 SQL、调整参数。
4. **验证**:再用同样的工具确认——**没有对比数据的优化不算优化**。

本文按这个顺序,依次介绍 MySQL 自带的几个分析工具,最后列出常见场景的优化手段。索引本身的原理和使用规则见 [mysql索引](./mysql索引.md),这里不重复。

::: tip
本文示例沿用索引一文中的 `tb_user` 表,并假设它有近 100 万行数据。示例里的耗时、行数都是为了说明问题设定的示意数据,你本机的数字会不一样,但**规律**是一致的。
:::

## 第一步:发现慢 SQL

### 查看 SQL 执行频率

MySQL 客户端连接成功后,可以通过 `show [session|global] status` 查看服务器状态。其中以 `Com_` 开头的计数器记录了各类语句的执行次数:

```sql
-- 7 个下划线,每个下划线匹配一个任意字符
show global status like 'Com_______';
```

| 计数器 | 含义 |
| --- | --- |
| `Com_select` | 执行 select 的次数,一次查询累加 1 |
| `Com_insert` | 执行 insert 的次数,批量插入只累加 1 次 |
| `Com_update` | 执行 update 的次数 |
| `Com_delete` | 执行 delete 的次数 |

通过它们可以判断这个数据库是**读多写少**还是**写多读少**,从而决定优化方向:

- 读多(以 `Com_select` 为主):重点放在**索引**上;
- 写多(以 `Com_insert`/`Com_update` 为主):索引不是越多越好,每个索引都要在写入时维护,这时要考虑批量写入、减少索引、读写分离等。

如果想知道 **InnoDB** 引擎层面的行操作次数,也可以看:

```sql
show global status like 'Innodb_rows_%';
```

### 慢查询日志

执行频率只能告诉你"谁用得多",不能告诉你"谁用得慢"。**慢查询日志**记录了所有执行时间**超过指定阈值**的 SQL,是定位慢 SQL 最直接的手段。

它默认是关闭的,先查看状态:

```sql
show variables like 'slow_query_log';
show variables like 'long_query_time';
```

开启方式有两种。临时开启(重启后失效):

```sql
set global slow_query_log = 1;
set global long_query_time = 2;   -- 超过 2 秒就记录,默认是 10 秒
```

::: warning
`set global long_query_time` 只对**新建立的连接**生效,当前已经连着的会话不受影响。改完之后重新连接再测试。
:::

永久开启:修改配置文件 `/etc/my.cnf`(Windows 下是 `my.ini`),在 `[mysqld]` 下添加后重启:

```ini
[mysqld]
# 开启慢查询日志
slow_query_log = 1
# 超过 2 秒的 SQL 记录下来
long_query_time = 2
# 日志文件位置(可选,不写有默认值,用 show variables like 'slow_query_log_file' 查看)
slow_query_log_file = /var/lib/mysql/slow.log
# 把没有使用索引的 SQL 也记下来(可选,日志量会变大,按需开启)
log_queries_not_using_indexes = 1
```

日志里每条记录大致长这样:

```
# Time: 2026-11-04T10:21:35.123456Z
# User@Host: root[root] @ localhost []  Id: 8
# Query_time: 0.842150  Lock_time: 0.000120  Rows_sent: 1  Rows_examined: 996742
select * from tb_user where phone = '17799990015';
```

看日志时盯住这几项:

| 字段 | 含义 |
| --- | --- |
| `Query_time` | 查询花费的总时间 |
| `Lock_time` | 等待锁的时间(远大于执行时间,说明是锁竞争导致的慢) |
| `Rows_sent` | 返回给客户端的行数 |
| `Rows_examined` | **服务器扫描的行数**。`Rows_examined` 远大于 `Rows_sent`,说明扫了很多"没用"的行,几乎一定可以通过索引优化 |

日志文件大了不方便肉眼看,MySQL 自带 `mysqldumpslow` 工具做汇总分析:

```bash
# 按查询时间排序,取前 10 条
mysqldumpslow -s t -t 10 /var/lib/mysql/slow.log

# 按平均扫描行数排序,并且只看包含 tb_user 的
mysqldumpslow -s ar -t 10 -g "tb_user" /var/lib/mysql/slow.log
```

常用排序参数 `-s`:`c` 次数、`t` 时间、`l` 锁定时间、`r` 返回行数,前面加 `a` 表示平均值(如 `at`)。

### show processlist:正在执行的 SQL

慢查询日志只有在语句**执行完**之后才会记录。如果现在数据库正卡着,想知道**此刻**是谁在占着资源,用:

```sql
show processlist;
```

| 字段 | 含义 |
| --- | --- |
| `Id` | 连接 ID,要强行终止可以 `kill Id` |
| `User` / `Host` / `db` | 谁、从哪里、连的哪个库 |
| `Command` | 当前在做什么:`Sleep`(空闲)、`Query`(执行中)等 |
| `Time` | 当前状态持续的秒数。`Query` 状态下持续很久的,就是嫌疑对象 |
| `State` | 状态,如 `Sending data`、`Waiting for table metadata lock` 等 |
| `Info` | 正在执行的 SQL 语句 |

## 第二步:定位慢在哪

找到了慢 SQL,接下来要回答:**它到底慢在哪个环节?**

### show profile:耗时都花在哪个阶段

`show profile` 能展示一条 SQL 在**各个执行阶段**分别花了多少时间。先确认当前版本支持,再开启:

```sql
select @@have_profiling;       -- YES 表示支持
select @@profiling;            -- 0 表示未开启
set profiling = 1;             -- 仅对当前会话有效
```

::: warning
`show profile` 从 MySQL 5.6.7 起就被标记为**废弃**(推荐使用 Performance Schema),在新版本里仍可使用,但可能会在未来版本移除。它的价值在于简单直观、学习成本低,适合入门和快速排查。
:::

开启之后随便执行几条 SQL,然后:

```sql
-- 1. 查看每一条 SQL 的总耗时
show profiles;

-- 2. 查看指定 SQL 各个阶段的耗时(Query_ID 来自上一条的结果)
show profile for query 2;

-- 3. 同时显示 CPU 的使用情况
show profile cpu for query 2;
```

`show profiles` 的结果里每条 SQL 都有一个 `Query_ID` 和总耗时 `Duration`。下面用示意数据演示:点击不同的行,就是执行对应的 `show profile for query N`,看看时间都花在哪个阶段。

<ProfileDemo />

读这张图的要点:

- 解析、权限检查、打开表、优化……这些"前后台"阶段通常都是微秒级,**不用关心**。
- 真正有分量的往往是 `Sending data`:它表示"读取并处理记录",全表扫描时它会变得非常大。第 1 条和第 2 条是**同一条 SQL**,差别只在有没有索引,整个差距几乎全部落在这一项上。
- 如果还出现了 `Creating sort index`(旧版叫 `Sorting result`),说明有额外的排序开销,这时候回头看 explain 的 `Extra`,往往能看到 `Using filesort`。

`show profile` 只能告诉你"哪个阶段慢",要回答"**为什么**慢、MySQL 打算怎么执行",还得靠 explain。

### explain:看懂执行计划

`explain`(等价于 `desc`)展示 MySQL 打算**如何执行**一条 select 语句:走哪个索引、按什么顺序连接表、预计扫描多少行……各个字段的基本含义已经在 [mysql索引](./mysql索引.md) 一文的「性能分析:explain」一节列过表,这里侧重讲**怎么用它排查问题**。

下面的动画演示了三个典型场景:每个场景先看 explain 暴露的问题,再看优化手段,最后重新 explain 验证。点击「播放」,或者用 ▶| 一步步走,标红的是问题所在,标绿的是改善之处。

<ExplainDemo />

#### 看 explain 的几个步骤

拿到一份执行计划,可以按这个顺序看:

**1. 先看 `type`:有没有全表扫描**

从好到差:`system` > `const` > `eq_ref` > `ref` > `range` > `index` > `ALL`。日常优化至少要让查询达到 `range` 以上,**看到 `ALL` 就要警惕**。

::: tip
`index` 和 `ALL` 长得像:`index` 是扫描整棵**索引树**,`ALL` 是扫描整张**表**。索引通常比表小得多,所以 `index` 更快一点,但它依然是在"全量扫描",不要以为有 `index` 就没问题。
:::

**2. 再看 `key` 和 `possible_keys`:索引有没有真的用上**

- `possible_keys` 有值、`key` 为 `NULL`:有候选索引,但优化器最终没选(比如它认为全表扫描更便宜,或者被索引失效的写法"劝退"了)。
- 两个都是 `NULL`:压根没有可用的索引。

**3. 用 `key_len` 判断联合索引用到了几列**

`key_len` 是**实际使用**的索引长度(字节)。联合索引 `(profession, age, status)` 里,每一列贡献的长度可以算出来:

| 列定义(字符集 utf8mb4) | 长度计算 |
| --- | --- |
| `profession varchar(50) not null` | 50 × 4 + 2(变长字段的长度前缀)= **202** |
| `age int`(允许 NULL) | 4 + 1(NULL 标志位)= **5** |
| `status char(1)`(允许 NULL) | 1 × 4 + 1 = **5** |

于是:`key_len` = 202,只用到 `profession`;= 207,用到 `profession, age`;= 212,三列全用上。这就是索引一文里最左前缀法则可以被验证的原因。

字段规则小结:`int` 4 字节、`bigint` 8 字节;`varchar(n)` 是 n × 字符集最大字节数 + 2;`char(n)` 是 n × 字符集最大字节数;字段可为 `NULL` 的再加 1。

**4. 看 `rows` 和 `filtered`:估算要读多少行**

`rows` 是优化器**估算**的扫描行数(不是精确值),`filtered` 是"读到的行里最终有多少比例满足条件"。`rows` 很大且 `filtered` 很低,说明读了很多无用的行。

**5. 最后看 `Extra`:有没有"坏味道"**

| Extra | 说明 | 怎么办 |
| --- | --- | --- |
| `Using filesort` | 排序没用上索引,需要额外排序 | 给 `order by` 的列建合适的索引 |
| `Using temporary` | 用了临时表 | 给 `group by`/`distinct` 的列建索引 |
| `Using where` | 用 where 过滤 | 本身不是问题,配合 `type` 一起看 |
| `Using index` | 覆盖索引,不用回表 | 好事 |
| `Using index condition` | 索引下推,部分过滤在存储引擎层完成 | 正常 |

#### explain 的更多用法

```sql
-- 1. 以 JSON 格式输出,信息更详细(能看到 cost 估算、used_key_parts 等)
explain format=json
select * from tb_user where profession = '软件工程' and age = 30;

-- 2. 紧跟在 explain 之后执行,查看优化器改写之后的 SQL
explain select * from tb_user where id = 1;
show warnings;

-- 3. MySQL 8.0.18+:真正执行语句,并给出实际耗时和实际行数
explain analyze
select * from tb_user where profession = '软件工程';
```

::: danger
**`explain analyze` 会真正执行语句**,而不是只做估算。对 select 来说只是多花一次查询的时间,但在生产环境的大表上,它同样会消耗和原查询一样多的资源,不要随手运行。普通的 `explain` 只做估算、不执行,可以放心使用。
:::

普通 `explain` 的 `rows` 是**估算值**,有时候和真实情况差距很大;`explain analyze` 会把"估算行数"和"实际行数"一起给出来,当两者相差悬殊时,通常说明表的**统计信息过期**了,可以执行 `analyze table tb_user;` 重新收集。

### optimizer trace:为什么优化器选了这个索引

有时候你明明建了索引,`explain` 里 `possible_keys` 也有,可 `key` 就是没选它。想知道优化器**是怎么权衡**的,可以打开优化器跟踪:

```sql
set optimizer_trace = 'enabled=on';
select * from tb_user where profession = '软件工程' and age > 20;
select * from information_schema.optimizer_trace\G
set optimizer_trace = 'enabled=off';
```

结果是一大段 JSON,重点看 `considered_execution_plans`:每个候选方案的预估代价(`cost`)都列在里面,优化器选**代价最小**的。这是进阶工具,日常排查先用 explain,遇到"为什么没选索引"的疑难杂症再用它。

## 第三步:常见场景的优化

### insert 优化

一条一条地插入,每条都要经历一次网络往返、一次事务提交,非常慢:

```sql
insert into tb_test values (1, 'tom');
insert into tb_test values (2, 'cat');
insert into tb_test values (3, 'jerry');
```

**① 批量插入**,一次插入多行(建议一次不超过 1000 条,太多会让单条 SQL 过大):

```sql
insert into tb_test values (1, 'tom'), (2, 'cat'), (3, 'jerry');
```

**② 手动控制事务**。默认每条 insert 都是一个自动提交的事务,频繁提交很耗时。把一批写入放进同一个事务,只提交一次:

```sql
start transaction;
insert into tb_test values (1, 'tom'), (2, 'cat'), (3, 'jerry');
insert into tb_test values (4, 'tom'), (5, 'cat'), (6, 'jerry');
insert into tb_test values (7, 'tom'), (8, 'cat'), (9, 'jerry');
commit;
```

**③ 主键顺序插入**。主键乱序插入会导致页分裂,顺序插入则只是不断往末尾追加,性能更好——原因在 [mysql索引](./mysql索引.md) 一文的「B+Tree 是怎么长出来的」动画里已经演示过。

**④ 大批量数据用 `load` 指令**。如果一次要导入百万、千万行数据,即使批量 insert 也不如 MySQL 提供的 `load data` 快:

```bash
# 连接时加上 --local-infile 参数
mysql --local-infile -u root -p
```

```sql
-- 开启从本地加载文件的开关
set global local_infile = 1;

-- 文件里每行一条记录,字段用逗号分隔
load data local infile '/root/tb_user.log'
into table tb_user
fields terminated by ','
lines terminated by '\n';
```

::: tip
同样导入 100 万条数据,`load data` 通常能比逐条 insert 快一个数量级。导入时**主键顺序排列**也能让它更快。
:::

### order by 优化

MySQL 有两种排序方式:

| 方式 | 说明 | explain 的 Extra |
| --- | --- | --- |
| **Using filesort** | 把满足条件的行读到**排序缓冲区**(`sort_buffer`)里,在缓冲区中完成排序;放不下就借助磁盘临时文件。所有**不是通过索引直接返回排序结果**的排序都叫 filesort | `Using filesort` |
| **Using index** | 通过有序索引**顺序扫描**直接返回有序数据,不需要额外排序 | `Using index` |

显然后者效率高。优化的目标就是:**尽量让排序走索引**。

```sql
-- 没有索引时:Using filesort
explain select id, age, phone from tb_user order by age, phone;

-- 建一个联合索引
create index idx_user_age_phone on tb_user(age, phone);

-- 现在:Using index
explain select id, age, phone from tb_user order by age, phone;
```

对于联合索引,排序还有一些需要注意的规则:

**1. 排序字段的顺序要和索引一致**,遵循最左前缀法则:

```sql
-- 索引 (age, phone)
select id, age, phone from tb_user order by age, phone;     -- Using index
select id, age, phone from tb_user order by phone, age;     -- 顺序反了:Using index; Using filesort
```

**2. 升序、降序要和索引一致**。索引默认是升序,如果两列都降序,MySQL 可以**反向扫描**索引,依然不需要 filesort(Extra 里会显示 `Backward index scan`);但是一升一降混着来,就必须 filesort:

```sql
select id, age, phone from tb_user order by age desc, phone desc;  -- Backward index scan,没问题
select id, age, phone from tb_user order by age asc, phone desc;   -- Using filesort
```

对于"一升一降"的场景,可以建一个**混合方向的索引**(MySQL 8.0 才真正支持降序索引):

```sql
create index idx_user_age_phone_ad on tb_user(age asc, phone desc);
```

**3. 要用覆盖索引**。如果 `select *`,查出的字段索引里没有,就需要回表,优化器往往认为"先全表读出来再排序"更划算,于是放弃用索引排序。所以排序类查询尽量只查需要的字段。

**4. 数据量大、排序放不下时**,可以适当调大排序缓冲区 `sort_buffer_size`(默认 256KB),让更多排序在内存里完成:

```sql
show variables like 'sort_buffer_size';
```

### group by 优化

分组操作的关键也是**索引**。没有索引时,`group by` 要建临时表来统计,Extra 里会出现 `Using temporary`:

```sql
-- 没有索引时:Using temporary
explain select profession, count(*) from tb_user group by profession;

-- 建立联合索引
create index idx_user_pro_age_sta on tb_user(profession, age, status);

-- 现在:Using index,没有临时表了
explain select profession, count(*) from tb_user group by profession;
```

分组同样遵循**最左前缀法则**:

```sql
-- 都能利用索引 (profession, age, status)
select profession, count(*) from tb_user group by profession;
select profession, age, count(*) from tb_user group by profession, age;

-- where 里是 profession 等值,group by 用 age:依然能走索引(profession 已经被固定)
select age, count(*) from tb_user where profession = '软件工程' group by age;
```

最后一条的原理:`profession` 已经固定为一个值,那么在这个值内部,`age` 就是有序的,所以按 `age` 分组仍然可以利用索引。

### limit 分页优化(深分页)

分页是最常见的需求,而**越往后翻越慢**是它最典型的问题:

```sql
select * from tb_sku limit 0, 10;          -- 很快
select * from tb_sku limit 2000000, 10;    -- 非常慢
```

为什么?因为 `limit 2000000, 10` 的含义是"**取出前 2000010 条,再丢掉前 2000000 条,只返回最后 10 条**"。前面那两百万条被白白读取,每一条还是 `select *` 带着所有列回表。

**优化思路:覆盖索引 + 子查询**。先**只查主键**(覆盖索引,不用回表),在索引里把那 10 个 id 找出来,再根据 id 去取完整行。

```sql
select s.*
from tb_sku s,
     (select id from tb_sku order by id limit 2000000, 10) a
where s.id = a.id;
```

这里的子查询只读主键索引,代价小得多;外层再用 10 个 id 去精确取整行。

::: warning
很多人想当然会写成 `where id in (select id from ... limit ...)`,但 MySQL 不支持在 `in` 子查询里直接用 `limit`(报 1235 错误),所以要像上面这样把它放进**派生表**里做连接。
:::

**更彻底的做法:记住上一页的位置**(键集分页 / keyset pagination)。如果业务是"下一页"这种顺序翻页,不需要随机跳页:

```sql
-- 上一页最后一条的 id 是 2000000
select * from tb_sku where id > 2000000 order by id limit 10;
```

这样直接用主键索引定位到 2000000 的位置,往后取 10 条,**无论翻到多深,速度都是一样的**。代价是它不能跳到任意页。

### count 优化

```sql
select count(*) from tb_user;
```

在数据量很大时,`count` 也很慢。原因要分引擎看:

- **MyISAM**:把表的总行数存在磁盘上,`count(*)` 直接读取,效率很高(不带 where 时)。
- **InnoDB**:需要一行一行地读出来累计。因为有事务和 MVCC,**同一时刻不同事务看到的"行数"可能不一样**,所以没办法直接存一个总数。

优化 `count` 最直接的办法是**自己维护计数**,例如:用 Redis 记录总数,每次增删时同步更新;或者单独建一张计数表。

#### count 的几种写法

`count()` 是聚合函数:对返回结果的每一行判断,**参数不为 NULL 就累加 1**。

| 写法 | 含义与效率 |
| --- | --- |
| `count(主键)` | InnoDB 遍历整张表,取出每行的主键 id 返回给服务层,服务层判断主键不可能为 NULL,直接累加 |
| `count(字段)` | 没有 not null 约束:取出每行该字段的值,判断是否为 NULL 再累加;有 not null 约束:直接累加 |
| `count(1)` | InnoDB 遍历整张表,但**不取值**,服务层对每一行放一个数字 1 进去,直接累加 |
| `count(*)` | InnoDB 对它做了专门优化,**不取值**,服务层直接按行累加 |

效率排序:

```
count(字段) < count(主键 id) < count(1) ≈ count(*)
```

所以统计总行数时,**直接用 `count(*)`**,不要用 `count(字段)` 去"节省"什么——它们的语义也不同:`count(字段)` 不统计该字段为 NULL 的行。

### update 优化

InnoDB 的行锁是**加在索引上**的,不是加在记录上的。如果 `update` 的 where 条件**没有用上索引**,行锁就会"升级"成表锁(严格地说,是扫描过程中碰到的每一行都被锁住,效果上等价于锁整张表),并发更新会互相阻塞:

```sql
-- 假设 name 上没有索引
-- 会话 A:
begin;
update tb_user set status = '1' where name = '张三';   -- 没有走索引,锁住整张表

-- 会话 B:更新完全不相干的另一行,也会被阻塞
update tb_user set status = '1' where name = '李四';   -- 阻塞,等待会话 A 提交
```

给 `name` 建上索引之后,两个会话各自只锁各自命中的行,互不影响。所以:**update 的 where 条件一定要走索引**,并且尽量让事务短小,尽早提交。

关于锁的更多内容,见 [mysql事务](./mysql事务.md)。

## 一个完整的排查例子

最后把前面的工具串起来。假设线上反馈"按手机号查用户很慢",怎么排查?

**1. 发现**:慢查询日志里有一条:

```
# Query_time: 0.842150  Lock_time: 0.000120  Rows_sent: 1  Rows_examined: 996742
select * from tb_user where phone = '17799990015';
```

`Rows_sent: 1` 而 `Rows_examined: 996742`——为了返回 1 行,扫了近 100 万行。

**2. 定位**:`set profiling = 1` 后执行一遍,`show profile` 显示时间几乎全在 `Sending data`——慢在读行,而不是别的环节。再 `explain`:

```
type: ALL    possible_keys: NULL    key: NULL    rows: 996742
```

全表扫描,没有可用索引。结论清晰。

**3. 优化**:phone 在业务上是唯一的,建**唯一索引**:

```sql
create unique index idx_user_phone on tb_user(phone);
```

**4. 验证**:再次 explain,`type` 变成 `const`,`rows` 变成 1;再看 `show profiles`,总耗时从近 1 秒降到不足 1 毫秒。

整个过程里,每一步都有数据支撑:**慢查询日志发现 → profile 和 explain 定位 → 针对性优化 → 同样的工具验证**。

## 小结

| 阶段 | 工具 | 解决的问题 |
| --- | --- | --- |
| 发现 | `show global status like 'Com_______'` | 读多还是写多,决定优化方向 |
| 发现 | 慢查询日志 + `mysqldumpslow` | 哪些 SQL 慢(事后) |
| 发现 | `show processlist` | 现在谁在占着资源(实时) |
| 定位 | `show profile` | 时间花在哪个执行阶段 |
| 定位 | `explain` | 怎么执行:有没有用索引、扫了多少行、有没有 filesort/临时表 |
| 定位 | `explain analyze`、`optimizer_trace` | 估算和实际的差距;优化器为什么这样选 |

常见优化手段速查:

| 场景 | 优化手段 |
| --- | --- |
| insert | 批量插入;手动控制事务;主键顺序插入;百万级数据用 `load data` |
| order by | 排序字段建索引,顺序、升降序与索引一致;覆盖索引;适当调大 `sort_buffer_size` |
| group by | 分组字段建索引(最左前缀法则) |
| limit 深分页 | 覆盖索引 + 子查询(派生表连接);或记住上一页位置,用 `id > xxx` |
| count | 统计总行数用 `count(*)`;大表自己维护计数 |
| update | where 条件走索引,避免行锁升级成表锁;事务尽量短 |
