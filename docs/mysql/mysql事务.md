---

title: mysql事务

meta:
  - name: description
    content: mysql事务
  - name: keywords
    content: mysql,事务,ACID,隔离级别

created: 2026/11/04

updated: 2026/11/04
 
tags:

---

## 什么是事务

事务(Transaction)是**一组操作的集合**,它是一个不可分割的工作单位。事务会把所有操作作为一个整体一起向系统提交或撤销:这些操作**要么同时成功,要么同时失败**。

最经典的例子是转账:张三给李四转 500 元,需要执行两步:

```sql
update account set balance = balance - 500 where name = '张三';  -- 1. 张三扣 500
update account set balance = balance + 500 where name = '李四';  -- 2. 李四加 500
```

如果第 1 步执行成功了,第 2 步却因为异常没有执行,会发生什么?先在**没有事务**的情况下看看:

<TxDemo mode="transferNoTx" />

500 元凭空消失了。要保证这两步"同生共死",就需要事务。

::: tip 示例数据
本文用到的示例表如下,两个账户初始余额都是 1000:

```sql
create table account (
  id      int primary key auto_increment comment 'ID',
  name    varchar(50) not null comment '姓名',
  balance int not null comment '余额'
) comment '账户表';

insert into account (id, name, balance) values (1, '张三', 1000), (2, '李四', 1000);
```
:::

## 事务的基本操作

### 提交方式

MySQL 默认**自动提交事务**(`autocommit = 1`):每执行一条增删改语句,都会被当作一个独立的事务,执行完立刻提交。这就是上面动画里"第一条 update 自动提交,无法撤销"的原因。

```sql
-- 查看事务的提交方式(1 = 自动提交,0 = 手动提交)
select @@autocommit;

-- 设置为手动提交(仅对当前会话有效)
set @@autocommit = 0;
```

### 控制事务的两种方式

**方式一:关闭自动提交**

```sql
set @@autocommit = 0;

-- 执行一组 SQL ...

commit;    -- 全部成功:提交
rollback;  -- 出现异常:回滚
```

关闭自动提交后,SQL 执行完不会立刻生效,必须手动 `commit` 或 `rollback`。

**方式二:显式开启事务(更常用)**

```sql
start transaction;   -- 或者写成 begin;

-- 执行一组 SQL ...

commit;    -- 全部成功:提交
rollback;  -- 出现异常:回滚
```

这种方式只对**这一次**事务有效,事务结束后又回到自动提交的状态,不会影响其他语句。

### 用事务改写转账

```sql
begin;

update account set balance = balance - 500 where name = '张三';
update account set balance = balance + 500 where name = '李四';

commit;
```

两条 update 都成功,`commit` 之后修改才一起生效:

<TxDemo mode="transferCommit" />

如果中途出错,在程序里捕获异常,执行 `rollback`,已经执行的修改会全部撤销:

<TxDemo mode="transferRollback" />

::: warning 几个容易踩的坑
- **只有 InnoDB 支持事务**。MyISAM 引擎不支持,建表时要注意存储引擎(MySQL 5.5 之后默认就是 InnoDB)。
- **DDL 会隐式提交**。在事务里执行 `create`、`alter`、`drop` 等语句,会先把当前事务提交掉,所以它们之后的 `rollback` 无法撤销之前的修改。
- 事务只回滚数据的修改,**不能撤销已经发生的外部操作**(比如已经发出去的短信、调用的第三方接口)。
:::

### 保存点(savepoint)

如果希望事务只回滚一部分,可以设置保存点:

```sql
begin;
update account set balance = balance - 100 where id = 1;
savepoint s1;                                               -- 设置保存点
update account set balance = balance - 100 where id = 1;
rollback to savepoint s1;                                   -- 只回滚到 s1,第二条 update 作废
commit;                                                     -- 第一条 update 被提交
```

## 事务的四大特性(ACID)

| 特性 | 英文 | 含义 | InnoDB 中的保证 |
| --- | --- | --- | --- |
| 原子性 | Atomicity | 事务是不可分割的最小操作单元,要么全部成功,要么全部失败 | undo log(回滚日志) |
| 一致性 | Consistency | 事务完成时,必须使所有数据都保持一致状态(比如转账前后总金额不变) | 由原子性、隔离性、持久性共同保证,再加上业务本身的约束 |
| 隔离性 | Isolation | 数据库提供的隔离机制,保证事务在不受外部并发操作影响的独立环境下运行 | 锁 + MVCC |
| 持久性 | Durability | 事务一旦提交或回滚,它对数据库中数据的改变就是永久的 | redo log(重做日志) |

上面转账的两个动画,展示的就是**原子性**:出错时 `rollback` 让数据回到事务开始之前的样子。下面的并发问题则与**隔离性**有关。

## 并发事务问题

数据库同时服务很多客户端,多个事务**并发执行**时,如果互相之间不隔离,就会出现各种数据问题:

| 问题 | 描述 |
| --- | --- |
| 脏读 | 一个事务读到了另一个事务**还没提交**的数据 |
| 不可重复读 | 一个事务先后读取**同一条记录**,但两次读取的数据**不同** |
| 幻读 | 一个事务按**条件**查询数据时,没有对应的数据行,但是在插入数据时,又发现这行数据已经存在,好像出现了"幻影";更常见的表现是:同一个查询,两次得到的**行数不同** |

下面的动画有两个会话 A 和 B,按时间从上到下依次执行。可以用右上角的下拉框切换**隔离级别**,对比各个级别下 A 读到的结果。

### 脏读

会话 B 把张三的余额改成 0,但**没有提交**,会话 A 就读到了这个值。随后 B 回滚,这个 0 根本没有真正存在过:

<TxDemo mode="dirty" level="RU" />

### 不可重复读

会话 A 在同一个事务里,两次读取同一行,中间会话 B 修改并提交了它,A 两次读到的结果不同:

<TxDemo mode="nonrepeatable" level="RC" />

### 幻读

会话 A 在同一个事务里,两次执行同样的查询,中间会话 B 插入了新记录并提交,A 第二次多看到了一行:

<TxDemo mode="phantom" level="RC" />

## 事务隔离级别

为了解决并发事务问题,SQL 标准定义了四种隔离级别。级别越高,数据越安全,但并发性能越差:

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| `READ UNCOMMITTED`(读未提交) | ⚠ 会出现 | ⚠ 会出现 | ⚠ 会出现 |
| `READ COMMITTED`(读已提交) | ✔ 不会 | ⚠ 会出现 | ⚠ 会出现 |
| `REPEATABLE READ`(可重复读,**MySQL 默认**) | ✔ 不会 | ✔ 不会 | ⚠ 会出现(标准定义) |
| `SERIALIZABLE`(串行化) | ✔ 不会 | ✔ 不会 | ✔ 不会 |

- **读未提交**:能读到别人没提交的数据,基本不会使用。
- **读已提交**:只能读到已提交的数据,是 Oracle、SQL Server 等数据库的默认级别。
- **可重复读**:同一个事务里多次读取同一数据,结果一致。这是 MySQL InnoDB 的默认级别。
- **串行化**:事务一个接一个地执行,读写都会加锁,事务之间会互相阻塞,性能最差。

::: tip InnoDB 的可重复读
上表里 `REPEATABLE READ` 的幻读是按 SQL 标准写的。在 InnoDB 里,**普通的 select 读的是快照**,事务内多次查询结果一致,基本不会出现幻读(见上面幻读动画切换到可重复读的效果);对于 `select ... for update`、`update`、`delete` 这类需要读最新数据的"当前读",InnoDB 通过 **next-key 锁(行锁 + 间隙锁)** 来防止其他事务在范围内插入新行。所以 InnoDB 的可重复读已经能避免大部分幻读场景。
:::

### 查看和设置隔离级别

```sql
-- 查看当前会话的隔离级别(MySQL 8.0;5.7.20 之前用 @@tx_isolation)
select @@transaction_isolation;

-- 设置隔离级别
set [session | global] transaction isolation level
    { read uncommitted | read committed | repeatable read | serializable };
```

- `session`:只对当前会话有效。
- `global`:对之后新建的所有会话有效。

例如把当前会话改成读已提交:

```sql
set session transaction isolation level read committed;
```

## 隔离性是怎么实现的(简介)

InnoDB 主要靠两样东西来实现隔离性:**锁**和 **MVCC**。

### MVCC(多版本并发控制)

MVCC 的核心思路是:**修改数据时不覆盖旧数据,而是保留多个历史版本**,读操作可以读旧版本,这样"读"和"写"就不用互相等待。它由三部分组成:

| 组成 | 作用 |
| --- | --- |
| 隐藏字段 | 每行数据都有隐藏字段 `DB_TRX_ID`(最近修改这行的事务 ID)和 `DB_ROLL_PTR`(指向上一个版本的回滚指针) |
| undo log | 保存数据修改前的旧版本,多个版本通过回滚指针串成**版本链**;同时也是回滚(原子性)的依据 |
| ReadView | 读视图,记录"生成视图那一刻,有哪些事务还没提交",用来判断版本链上哪个版本对当前事务可见 |

ReadView 的生成时机,恰好就是读已提交和可重复读的区别:

- **读已提交**:**每次**执行普通查询都生成一个新的 ReadView,所以总能看到最新提交的数据 → 会出现不可重复读。
- **可重复读**:只在事务里**第一次**普通查询时生成 ReadView,之后一直复用 → 事务内多次读取结果一致。

这正是前面动画里,切换到可重复读之后"A 两次读到的都是 1000"的原因。

### 锁

- **串行化**级别下,读会加共享锁,写会加排他锁,冲突的操作只能排队等待(动画里 ⏳ 阻塞的那些语句就是这样来的)。
- 修改数据时,InnoDB 会给涉及的行加**排他锁**,直到事务结束才释放,所以两个事务同时修改同一行时,后来的会等待。

## 使用事务的建议

1. **事务要尽量短小**。事务时间越长,持有的锁越久,其他事务等待越多;同时还会让 undo log 保留的旧版本迟迟无法清理。
2. **不要在事务里做耗时操作**,比如远程调用、等待用户输入。
3. **一定要处理异常并回滚**。程序里捕获到异常,要显式 `rollback`,否则连接上遗留一个未结束的事务,会一直占着锁。
4. **多个事务按相同的顺序访问数据**。比如都先更新 id 小的账户,再更新 id 大的,可以大幅减少死锁。
5. 根据业务选择隔离级别。大多数场景用默认的可重复读(或读已提交)就足够了,没必要使用串行化。

## 小结

| 知识点 | 要点 |
| --- | --- |
| 事务 | 一组操作的集合,要么同时成功,要么同时失败 |
| 控制事务 | `begin` / `start transaction` → `commit` / `rollback`;或关闭 `autocommit` |
| ACID | 原子性、一致性、隔离性、持久性 |
| 并发问题 | 脏读、不可重复读、幻读 |
| 隔离级别 | 读未提交 → 读已提交 → 可重复读(默认)→ 串行化,级别越高越安全、性能越低 |
| 实现原理 | undo log 保证原子性,redo log 保证持久性,锁 + MVCC 保证隔离性 |
