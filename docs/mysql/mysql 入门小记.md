---

title: mysql入门小记

meta:
  - name: description
    content: mysql入门小记
  - name: keywords
    content: mysql

created: 2026/06/12

updated: 2026/06/12
 
tags:

---
## 数据类型

| 分类 | 类型 | 存储空间 | 说明 / 适用场景 |
| --- | --- | --- | --- |
| 整数 | `TINYINT` | 1 字节 | 范围 -128 ~ 127(无符号 0 ~ 255),适合状态、性别等枚举值 |
| 整数 | `SMALLINT` | 2 字节 | 范围 -32768 ~ 32767(无符号 0 ~ 65535) |
| 整数 | `MEDIUMINT` | 3 字节 | 范围约 ±838 万(无符号约 1677 万) |
| 整数 | `INT` / `INTEGER` | 4 字节 | 范围约 ±21 亿(无符号约 42 亿),最常用,常作主键 |
| 整数 | `BIGINT` | 8 字节 | 范围约 ±9.2×10¹⁸,适合分布式 ID、大数据量主键 |
| 浮点数 | `FLOAT` | 4 字节 | 单精度,存在精度误差,不适合金额 |
| 浮点数 | `DOUBLE` | 8 字节 | 双精度,存在精度误差 |
| 定点数 | `DECIMAL(M,D)` | 随精度变化 | 精确小数,M 为总位数,D 为小数位数,**金额首选** |
| 字符串 | `CHAR(N)` | 固定 N 个字符 | 定长,不足补空格,适合手机号、MD5、身份证号等定长数据 |
| 字符串 | `VARCHAR(N)` | 实际长度 + 1~2 字节 | 变长,最常用,适合用户名、标题等 |
| 字符串 | `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | 最大 255B / 64KB / 16MB / 4GB | 长文本,如文章内容;不能有默认值,不建议建普通索引 |
| 二进制 | `BINARY` / `VARBINARY` | 同 CHAR / VARCHAR | 存储二进制字节串 |
| 二进制 | `BLOB` 系列 | 同 TEXT 系列 | 存储二进制大对象,实际开发中更推荐存文件路径 / 对象存储 URL |
| 枚举与集合 | `ENUM('a','b',...)` | 1~2 字节 | 从预定义值中单选 |
| 枚举与集合 | `SET('a','b',...)` | 1~8 字节 | 从预定义值中多选 |
| 日期时间 | `DATE` | 3 字节 | 格式 `YYYY-MM-DD` |
| 日期时间 | `TIME` | 3 字节 | 格式 `HH:MM:SS` |
| 日期时间 | `YEAR` | 1 字节 | 格式 `YYYY` |
| 日期时间 | `DATETIME` | 5~8 字节 | 格式 `YYYY-MM-DD HH:MM:SS`,范围 1000 ~ 9999 年,与时区无关 |
| 日期时间 | `TIMESTAMP` | 4~7 字节 | 范围 1970 ~ 2038 年,存储 UTC 时间并随会话时区转换 |
| JSON | `JSON` | 随内容变化 | MySQL 5.7+ 支持,可对 JSON 内部字段做查询和生成列索引 |
| 空间数据 | `GEOMETRY`、`POINT` 等 | 随类型变化 | 存储地理位置信息 |

## 约束

| 约束 | 描述 | 关键字 |
| --- | --- | --- |
| 非空约束 | 限制该字段的数据不能为 null | `NOT NULL` |
| 唯一约束 | 保证该字段的所有数据都是唯一、不重复的 | `UNIQUE` |
| 主键约束 | 主键是一行数据的唯一标识,要求非空且唯一 | `PRIMARY KEY` |
| 默认约束 | 保存数据时,如果未指定该字段的值,则采用默认值 | `DEFAULT` |
| 检查约束(8.0.16 版本之后) | 保证字段值满足某一个条件 | `CHECK` |
| 外键约束 | 用来让两张表的数据之间建立连接,保证数据的一致性和完整性 | `FOREIGN KEY` |

## 多表查询

多表查询指从多张表中一起查询数据。实际业务中,数据通常会按功能拆分到多张表里(比如员工表和部门表),这样可以避免数据冗余。需要完整信息时,再通过表与表之间的关联关系,把数据"拼"起来查出来。

多表查询大体分为两类:

| 分类 | 说明 | 本文是否介绍 |
| --- | --- | --- |
| 连接查询 | 把多张表按条件"连"在一起查询 | ✅ 内连接、外连接、自连接 |
| 子查询 | 在一条 SQL 里嵌套另一条 SELECT | ✅ 标量、列、行、表子查询,相关子查询,EXISTS |

### 准备数据

后面所有的例子和动画,都基于下面两张表:

```sql
-- 部门表
create table dept (
  id   int primary key auto_increment comment '部门 ID',
  name varchar(50) not null comment '部门名称'
) comment '部门表';

-- 员工表
create table emp (
  id         int primary key auto_increment comment '员工 ID',
  name       varchar(50) not null comment '姓名',
  dept_id    int comment '所属部门 ID(没有部门时为 NULL)',
  manager_id int comment '直属领导 ID(没有领导时为 NULL)'
) comment '员工表';

insert into dept (id, name) values
  (1, '研发部'),
  (2, '市场部'),
  (3, '财务部');

insert into emp (id, name, dept_id, manager_id) values
  (1, '张三', 1, null),
  (2, '李四', 1, 1),
  (3, '王五', 2, 1),
  (4, '赵六', 2, 3),
  (5, '钱七', null, 1);
```

| emp.id | name | dept_id | manager_id |
| --- | --- | --- | --- |
| 1 | 张三 | 1 | NULL |
| 2 | 李四 | 1 | 1 |
| 3 | 王五 | 2 | 1 |
| 4 | 赵六 | 2 | 3 |
| 5 | 钱七 | NULL | 1 |

| dept.id | name |
| --- | --- |
| 1 | 研发部 |
| 2 | 市场部 |
| 3 | 财务部 |

数据里特意留了两个"特殊情况",后面讲外连接时会用到:

- **钱七**没有所属部门(`dept_id` 为 `NULL`)
- **财务部**下面没有任何员工
- **张三**是最高领导,没有上级(`manager_id` 为 `NULL`)

::: tip 如何使用下面的动画
每个动画都可以 **播放 / 暂停 / 上一步 / 下一步**,也可以拖动进度条。左边是参与连接的表,正在比较的行会高亮(绿色 = 条件成立,红色 = 不成立,橙色 = 没匹配但要保留);下面的结果表会随着步骤一行一行长出来。
:::

### 笛卡尔积

笛卡尔积(Cartesian Product)是数学中的概念:有集合 A 和集合 B,A、B 所有可能的组合情况就是 A × B。

例如 A = {1, 2},B = {a, b, c},则:

```
A × B = {(1,a), (1,b), (1,c), (2,a), (2,b), (2,c)}
```

放到 MySQL 里,就是**两张表的每一行都与另一张表的每一行组合一次**,结果的行数等于两张表行数的乘积。

```sql
select * from emp, dept;
```

emp 有 5 行、dept 有 3 行,所以结果是 5 × 3 = 15 行。播放动画看看是怎么组合出来的:

<JoinDemo mode="cross" />

可以看到,每个员工都和每个部门配了一次对,其中绝大部分是没有意义的(张三并不属于市场部)。

#### 消除无效的笛卡尔积

多表查询时必须加上**连接条件**,过滤掉无效的组合,只保留有关联关系的数据:

```sql
select * from emp, dept where emp.dept_id = dept.id;
```

这样每个员工只会匹配到自己所属的部门。这其实就是下一节要讲的**内连接**(隐式写法)。

::: warning 注意
忘记写连接条件会产生笛卡尔积。两张表各 1 万行,结果就是 1 亿行,既慢又占内存,生产环境要特别避免。
:::

### 内连接

内连接(INNER JOIN)查询的是**两张表交集部分**的数据:只有满足连接条件的行才会出现在结果里,不满足的行(无论来自哪张表)都会被丢弃。

内连接有两种写法:

**1. 隐式内连接**:用逗号分隔表,连接条件写在 `where` 里

```sql
select 字段列表 from 表1, 表2 where 条件;
```

**2. 显式内连接**:用 `inner join ... on` 明确写出连接,条件写在 `on` 后面(`inner` 可以省略)

```sql
select 字段列表 from 表1 [inner] join 表2 on 连接条件;
```

例子:查询每个员工的姓名,以及所属部门的名称。

```sql
-- 隐式
select emp.name, dept.name from emp, dept where emp.dept_id = dept.id;

-- 显式
select emp.name, dept.name from emp inner join dept on emp.dept_id = dept.id;
```

动画演示(以左表 emp 为驱动,逐行去右表 dept 里找匹配):

<JoinDemo mode="inner" />

观察结果可以发现:

- 张三、李四 → 研发部;王五、赵六 → 市场部,共 4 行
- **钱七消失了**:他的 `dept_id` 是 `NULL`,而 `NULL = 任何值` 的结果都不是真,所以永远匹配不上
- **财务部消失了**:没有任何员工的 `dept_id` 等于 3

::: tip 表别名
表名较长时可以起别名,写法是 `表名 [as] 别名`:

```sql
select e.name, d.name from emp e inner join dept d on e.dept_id = d.id;
```

⚠️ 一旦给表起了别名,就**只能用别名**来引用它的字段,不能再用原来的表名。
:::

::: tip 显式写法更推荐
显式的 `join ... on` 把"连接条件"和"过滤条件"分开(前者放 `on`,后者放 `where`),可读性更好;而且忘记写 `on` 会直接报语法错误,不容易不小心写出笛卡尔积。
:::

### 外连接

内连接会丢掉不匹配的行。如果希望**保留某一张表的全部数据**,即使对方没有匹配的行,就要用外连接(OUTER JOIN)。

外连接分两种:

| 类型 | 语法 | 保留哪边 | 另一边没匹配时 |
| --- | --- | --- | --- |
| 左外连接 | `表1 left [outer] join 表2 on 条件` | **左表**(表1)的全部数据 + 交集 | 右表字段补 `NULL` |
| 右外连接 | `表1 right [outer] join 表2 on 条件` | **右表**(表2)的全部数据 + 交集 | 左表字段补 `NULL` |

`outer` 关键字可以省略,日常写 `left join` / `right join` 即可。

#### 左外连接

查询所有员工及其部门,**没有部门的员工也要显示**:

```sql
select emp.name, emp.dept_id, dept.id, dept.name
from emp left join dept on emp.dept_id = dept.id;
```

<JoinDemo mode="left" />

对比内连接:多了一行**钱七**,他在右表找不到匹配,于是右侧字段(`dept.id`、`dept.name`)用 `NULL` 补齐。财务部依然不会出现,因为它在右表,而左连接只保证左表完整。

#### 右外连接

查询所有部门及其员工,**没有员工的部门也要显示**:

```sql
select emp.name, emp.dept_id, dept.id, dept.name
from emp right join dept on emp.dept_id = dept.id;
```

<JoinDemo mode="right" />

这次是以右表 dept 为驱动:每个部门都会出现,财务部没有员工,所以左侧字段(`emp.name`、`emp.dept_id`)补 `NULL`。钱七不属于任何部门,这次反而被丢掉了。

::: tip 右连接可以改写成左连接
`A right join B` 等价于 `B left join A`,只是把两张表的位置对调。因为"左表为主"更符合阅读习惯,实际开发中**绝大多数人只用左连接**。上面的右连接可以写成:

```sql
select emp.name, emp.dept_id, dept.id, dept.name
from dept left join emp on emp.dept_id = dept.id;
```
:::

#### 外连接的常见用法:找出"没有"的数据

左连接之后,右表没匹配上的行,它的字段全是 `NULL`。利用这一点可以查"不存在关联数据"的记录,比如**没有员工的部门**:

```sql
select dept.*
from dept left join emp on emp.dept_id = dept.id
where emp.id is null;
```

结果只有财务部。

::: warning on 和 where 的区别(外连接中很重要)
- `on`:决定**两张表怎么匹配**,在补 `NULL` 之前生效。
- `where`:对**连接完成后的结果**再过滤。

在左连接里,如果把右表的过滤条件写在 `where` 里,那些被补了 `NULL` 的行会被过滤掉,左连接就"退化"成了内连接。右表的过滤条件应该放在 `on` 里。
:::

::: warning MySQL 不支持全外连接
标准 SQL 里还有 `full join`(左右两边都保留),但 MySQL **不支持**。需要时可以把左连接和右连接的结果用 `union` 合并:

```sql
select * from emp left join dept on emp.dept_id = dept.id
union
select * from emp right join dept on emp.dept_id = dept.id;
```
:::

### 自连接

自连接就是**把一张表当成两张表来连接自己**。典型场景是表中的某个字段指向本表的另一行:比如 `emp.manager_id` 存的是**另一个员工**的 `id`。

要查"每个员工和他的领导是谁",员工和领导的信息都在 `emp` 里,这时就需要自己连自己。

自连接的语法和普通连接一样,但有一个硬性要求:**必须给表起别名**,否则 MySQL 无法区分两个 `emp` 分别是哪一个。

```sql
select 字段列表 from 表A 别名A join 表A 别名B on 条件;
```

自连接既可以用内连接,也可以用外连接。先看**内连接**:

```sql
-- e 当"员工",m 当"领导"
select e.name, e.manager_id, m.id, m.name
from emp e inner join emp m on e.manager_id = m.id;
```

<JoinDemo mode="self" />

结果有 4 行。张三是最高领导,`manager_id` 为 `NULL`,匹配不上,被内连接丢掉了。如果要让他也出现在结果里,就改成**左外连接**:

```sql
select e.name, e.manager_id, m.id, m.name
from emp e left join emp m on e.manager_id = m.id;
```

<JoinDemo mode="selfLeft" />

这次张三保留了下来,领导一栏是 `NULL`。

### 连接查询小结

| 连接方式 | 语法 | 结果包含 | 典型场景 |
| --- | --- | --- | --- |
| 笛卡尔积 | `from A, B`(没有条件) | A × B 的所有组合 | 一般是写错了,要避免 |
| 内连接 | `A inner join B on ...` | 只有两边都匹配的行 | 查有关联关系的数据 |
| 左外连接 | `A left join B on ...` | A 的全部行 + 匹配的 B(没匹配补 NULL) | 保证主表完整;找"没有关联数据"的记录 |
| 右外连接 | `A right join B on ...` | B 的全部行 + 匹配的 A(没匹配补 NULL) | 等价于对调后的左连接 |
| 自连接 | `A a1 join A a2 on ...` | 同一张表自己和自己连接 | 层级关系(员工—领导、分类—父分类) |

### 子查询

SQL 语句中**嵌套了另一条 SELECT 语句**,就称为嵌套查询,也叫子查询。

```sql
select * from t1 where column1 = (select column1 from t2 where ...);
```

- 括在括号里的 `select` 叫**子查询**(内层查询),外面的语句叫**外层查询**。
- 外层语句可以是 `insert`、`update`、`delete`、`select` 中的任意一种。
- 子查询的结果会被外层语句"消费":当作一个值、一个集合,或者当作一张临时表来用。

子查询有三种常见的分类方式:

| 分类依据 | 类型 | 说明 |
| --- | --- | --- |
| 按**返回结果** | 标量子查询 | 返回单个值(1 行 1 列) |
| | 列子查询 | 返回一列(多行 1 列) |
| | 行子查询 | 返回一行(1 行多列) |
| | 表子查询 | 返回多行多列 |
| 按**出现位置** | `where` 之后 | 最常见,当作条件 |
| | `from` 之后 | 把子查询的结果当作一张临时表 |
| | `select` 之后 | 当作一个计算出来的字段(必须是标量) |
| 按**是否依赖外层** | 非相关子查询 | 自己就能独立执行,只执行一次 |
| | 相关子查询 | 引用了外层查询的字段,外层每一行都要重新执行 |

#### 补充示例数据

为了讲子查询,先给 `emp` 加上工资字段:

```sql
alter table emp add column salary decimal(10, 2) comment '工资';

update emp set salary = 20000 where id = 1;
update emp set salary = 12000 where id = 2;
update emp set salary = 15000 where id = 3;
update emp set salary = 9000  where id = 4;
update emp set salary = 8000  where id = 5;
```

| id | name | dept_id | manager_id | salary |
| --- | --- | --- | --- | --- |
| 1 | 张三 | 1 | NULL | 20000 |
| 2 | 李四 | 1 | 1 | 12000 |
| 3 | 王五 | 2 | 1 | 15000 |
| 4 | 赵六 | 2 | 3 | 9000 |
| 5 | 钱七 | NULL | 1 | 8000 |

全公司平均工资是 (20000 + 12000 + 15000 + 9000 + 8000) / 5 = **12800**;研发部平均 16000,市场部平均 12000。

#### 标量子查询

子查询返回的结果是**单个值**(数字、字符串、日期等)。外层可以像使用普通常量一样,配合 `=`、`<>`、`>`、`>=`、`<`、`<=` 来比较。

**例 1**:查询"研发部"的所有员工。

```sql
select * from emp
where dept_id = (select id from dept where name = '研发部');
```

执行过程:先执行子查询得到研发部的 id = `1`,外层语句就等价于 `where dept_id = 1`。结果是张三、李四。

**例 2**:查询工资高于公司平均工资的员工。

```sql
select * from emp where salary > (select avg(salary) from emp);
```

<SubqueryDemo mode="scalar" />

::: warning 返回多行会报错
`=`、`>` 这类操作符要求子查询**最多返回一个值**。如果子查询返回了多行,MySQL 会报错:`Subquery returns more than 1 row`。遇到多行就要改用下面的列子查询。
:::

#### 列子查询

子查询返回**一列多行**,相当于一个"集合"。外层需要使用能处理集合的操作符:

| 操作符 | 含义 |
| --- | --- |
| `IN` | 在指定的集合范围内,多选一 |
| `NOT IN` | 不在指定的集合范围内 |
| `ANY` / `SOME` | 子查询返回列表中,**有任意一个**满足即可(`SOME` 与 `ANY` 等价) |
| `ALL` | 子查询返回列表中,**所有值**都必须满足 |

**IN**:查询"研发部"和"市场部"的所有员工。

```sql
select * from emp
where dept_id in (select id from dept where name in ('研发部', '市场部'));
```

<SubqueryDemo mode="in" />

**ANY / SOME**:查询比研发部**任意一人**工资高的员工(只要比研发部里工资最低的那个高就行)。

```sql
select * from emp
where salary > any (select salary from emp where dept_id = 1);
```

研发部的工资列表是 `(20000, 12000)`,只要大于其中任意一个,等价于大于 12000。结果是张三(20000)、王五(15000)。李四本身就是 12000,不大于自己,所以不在结果里。

**ALL**:查询比市场部**所有人**工资都高的员工。

```sql
select * from emp
where salary > all (select salary from emp where dept_id = 2);
```

市场部的工资列表是 `(15000, 9000)`,要同时大于两个值,等价于大于 15000。结果只有张三。

::: tip 几个等价关系
- `= any (...)` 等价于 `in (...)`
- `<> all (...)` 等价于 `not in (...)`
- `> any (...)` 等价于 `> (select min(...))`;`> all (...)` 等价于 `> (select max(...))`
:::

##### NOT IN 的 NULL 陷阱

查询**没有员工的部门**,很容易写出这样的 SQL:

```sql
select * from dept where id not in (select dept_id from emp);
```

本来应该查出财务部,但结果是 **0 行**。播放动画,看看为什么:

<SubqueryDemo mode="notin" />

原因是 SQL 采用三值逻辑(真、假、UNKNOWN)。`3 not in (1, 1, 2, 2, NULL)` 展开后是:

```
3 <> 1  AND  3 <> 1  AND  3 <> 2  AND  3 <> 2  AND  3 <> NULL
  真          真          真          真          UNKNOWN
```

`真 AND UNKNOWN` 的结果是 UNKNOWN,而 `where` 只会保留结果为"真"的行,于是财务部被丢掉了。钱七的 `dept_id` 是 `NULL`,正是这个 NULL 搞出了问题。

有两种修复方式:

```sql
-- 方式一:在子查询里排除 NULL
select * from dept where id not in (select dept_id from emp where dept_id is not null);

-- 方式二:改用 NOT EXISTS(见后文,推荐)
```

<SubqueryDemo mode="notinFix" />

::: danger 记住
只要 `NOT IN` 的子查询结果里**可能出现 NULL**,整个条件就会永远不为真。使用 `NOT IN` 之前,要么确保子查询的字段不会是 NULL,要么用 `NOT EXISTS`。
:::

#### 行子查询

子查询返回的结果是**一行**(可以是多列)。常用操作符:`=`、`<>`、`IN`、`NOT IN`。比较时,多个字段要**成对地整体比较**,写成 `(字段1, 字段2)` 的形式。

**例**:查询与"李四"**部门相同、直属领导也相同**的员工。

```sql
select * from emp
where (dept_id, manager_id) = (select dept_id, manager_id from emp where name = '李四');
```

子查询返回一行 `(1, 1)`,外层等价于 `where dept_id = 1 and manager_id = 1`。结果里只有李四本人,因为表里没有和他部门、领导都相同的同事。

#### 表子查询

子查询返回的结果是**多行多列**,相当于一张临时表。有两种常见用法。

**用法一:放在 `where` 之后,配合 `IN`**

查询与"李四""王五"两人**部门和领导都相同**的员工:

```sql
select * from emp
where (dept_id, manager_id) in (
  select dept_id, manager_id from emp where name in ('李四', '王五')
);
```

子查询返回两行两列 `(1, 1)`、`(2, 1)`,外层逐行检查每个员工的 `(dept_id, manager_id)` 是否在这个集合里。结果是李四和王五。

**用法二:放在 `from` 之后,当作临时表(派生表)**

先在子查询里分组算出每个部门的平均工资,再把这个结果当作一张表去连接 `dept`,查询**平均工资高于 13000 的部门**:

```sql
select d.name, t.avg_salary
from dept d
join (
  select dept_id, avg(salary) as avg_salary
  from emp
  group by dept_id
) t on d.id = t.dept_id
where t.avg_salary > 13000;
```

子查询(临时表 `t`)的结果:

| dept_id | avg_salary |
| --- | --- |
| 1 | 16000 |
| 2 | 12000 |
| NULL | 8000 |

再与 `dept` 连接并过滤,最终只有**研发部**(16000)。

::: warning 派生表必须有别名
放在 `from` 后面的子查询必须起别名(上例中的 `t`),否则会报错 `Every derived table must have its own alias`。
:::

#### 放在 select 之后的子查询

子查询还可以出现在 `select` 的字段列表里,当作一个计算出来的字段。这种位置只能放**标量子查询**(每行只能返回一个值)。

查询每个部门的名称和员工人数:

```sql
select d.name,
       (select count(*) from emp e where e.dept_id = d.id) as emp_count
from dept d;
```

| name | emp_count |
| --- | --- |
| 研发部 | 2 |
| 市场部 | 2 |
| 财务部 | 0 |

这个子查询用到了外层的 `d.id`,属于下面要讲的相关子查询。

#### 相关子查询

前面的例子里,子查询都能**独立运行**,只会执行一次,叫**非相关子查询**。如果子查询里引用了**外层查询的字段**,它就不能独立运行,外层每取一行,都要把这一行的值"代入"进去重新执行一次,这叫**相关子查询**。

**例**:查询工资高于**本部门**平均工资的员工。

```sql
select * from emp e
where salary > (select avg(salary) from emp where dept_id = e.dept_id);
```

这里的"平均工资"每个人都不一样(取决于他所在的部门),所以没法只算一次。播放动画观察:每一行都会触发一次新的子查询:

<SubqueryDemo mode="correlated" />

注意钱七:他的 `dept_id` 是 `NULL`,`dept_id = NULL` 永远不成立,同部门平均工资算出来是 `NULL`,比较结果是 UNKNOWN,所以他不会出现在结果里。

::: tip 相关子查询的性能
相关子查询在逻辑上要对外层每一行都执行一次,数据量大时可能很慢。MySQL 优化器会尽量改写它(比如转成连接),但写之前最好用 `explain` 看一下执行计划,必要时用连接或派生表改写。
:::

#### EXISTS 和 NOT EXISTS

`EXISTS` 只关心子查询**有没有返回行**:有行就为真,一行都没有就为假。它不关心返回的内容,所以子查询里习惯写 `select 1`。

查询**有员工的部门**:

```sql
select * from dept d
where exists (select 1 from emp e where e.dept_id = d.id);
```

<SubqueryDemo mode="exists" />

反过来,`NOT EXISTS` 在子查询**一行都找不到**时为真。查询**没有员工的部门**:

```sql
select * from dept d
where not exists (select 1 from emp e where e.dept_id = d.id);
```

<SubqueryDemo mode="notexists" />

这正是前面 `NOT IN` 陷阱的正确解法。`EXISTS` 只判断"有没有行",**不受 NULL 影响**,所以查没有关联数据的记录时,`NOT EXISTS` 比 `NOT IN` 更安全。

| 对比 | `IN` / `NOT IN` | `EXISTS` / `NOT EXISTS` |
| --- | --- | --- |
| 子查询类型 | 通常是非相关,先算出集合 | 通常是相关,每行检查一次 |
| 子查询返回 | 一列的值 | 有没有行(内容无所谓) |
| 遇到 NULL | `NOT IN` 会因为 NULL 而失效 | 不受影响 |

#### 在增删改中使用子查询

子查询不只能用在 `select` 里。比如给研发部全体员工涨薪 10%:

```sql
update emp
set salary = salary * 1.1
where dept_id = (select id from dept where name = '研发部');
```

::: warning 不能一边改表、一边从同一张表里查
MySQL 不允许在 `update` / `delete` 的子查询里直接查询**正在被修改的那张表**,会报错 `You can't specify target table 'emp' for update in FROM clause`。例如下面的写法就是错误的:

```sql
-- ❌ 报错 1093
delete from emp where salary < (select avg(salary) from emp);
```

解决办法是再套一层派生表,让 MySQL 先把子查询的结果物化成临时表:

```sql
-- ✅ 正确
delete from emp
where salary < (select avg_salary from (select avg(salary) as avg_salary from emp) t);
```

这两条是会真正删除数据的示例,请不要在上面的演示数据上随手执行。
:::

#### 子查询还是连接?

很多需求既可以用子查询,也可以用连接实现。比如"查询研发部的员工":

```sql
-- 子查询
select * from emp where dept_id in (select id from dept where name = '研发部');

-- 连接
select emp.* from emp join dept on emp.dept_id = dept.id where dept.name = '研发部';
```

选择的一般原则:

- **需要用到另一张表的字段**(要在结果里展示出来)→ 用连接。
- **只需要用另一张表做判断**(过滤、统计),或者要用聚合值做比较(如平均值)→ 子查询更直观。
- 简单的 `IN` 子查询,MySQL 8.0 会自动优化(半连接),性能通常和连接差不多;复杂场景以 `explain` 的执行计划为准,不要凭感觉。

### 子查询小结

| 类型 | 子查询返回 | 常用操作符 | 示例 |
| --- | --- | --- | --- |
| 标量子查询 | 单个值 | `=` `<>` `>` `>=` `<` `<=` | `salary > (select avg(salary) from emp)` |
| 列子查询 | 一列多行 | `IN` `NOT IN` `ANY` `SOME` `ALL` | `dept_id in (select id from dept ...)` |
| 行子查询 | 一行多列 | `=` `<>` `IN` `NOT IN` | `(a, b) = (select a, b from ...)` |
| 表子查询 | 多行多列 | `IN`,或放在 `from` 后当临时表 | `from (select ... group by ...) t` |
| 相关子查询 | 引用外层字段,逐行执行 | 任意 | `where salary > (select avg(salary) ... where dept_id = e.dept_id)` |
| EXISTS | 只看有没有行 | `EXISTS` `NOT EXISTS` | `exists (select 1 from emp where ...)` |

::: tip 写子查询的几个习惯
1. 先单独把子查询跑一遍,确认返回的是**单值、一列还是多列**,再选对应的操作符。
2. 用 `NOT IN` 前先确认子查询的字段不会有 `NULL`,不确定就用 `NOT EXISTS`。
3. `from` 后面的子查询一定要起别名。
4. 嵌套层数太多就改用连接或临时表,可读性和性能都会更好。
:::
