# 数据库

记录 MySQL、Hologres、数据仓库和性能优化的实践经验。

---

## 📑 知识目录

### 关系型数据库

- **MySQL**：索引优化、事务隔离、主从复制
- **Hologres**：实时数仓、OLAP 查询优化
- **PostgreSQL**：JSON 支持、全文检索、扩展生态

### 数据仓库

- **分层架构**：ODS、DWD、DWS、ADS 分层设计
- **数据建模**：星型模型、雪花模型与维度建模
- **ETL 流程**：抽取、转换、加载的最佳实践

### 性能优化

- **索引策略**：B+树、哈希索引与覆盖索引
- **查询优化**：执行计划分析与慢查询调优
- **分区表**：数据分片与冷热分离

---

## 🔗 核心概念

### 事务 ACID

| 特性 | 含义 | 实现机制 |
|------|------|----------|
| 原子性 | 要么全做，要么全不做 | 事务日志 |
| 一致性 | 数据保持有效状态 | 约束检查 |
| 隔离性 | 事务相互独立 | 锁机制 |
| 持久性 | 提交后永不丢失 | 持久化存储 |

### SQL 优化技巧

```sql
-- 避免 SELECT *
SELECT id, name, created_at FROM users WHERE status = 1;

-- 使用覆盖索引
CREATE INDEX idx_users_status ON users(status, id, name);

-- 合理使用 JOIN 顺序
SELECT u.name, o.order_no 
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 1;
```

---

## 💡 最佳实践

!!! tip "性能优化建议"

    1. **分析执行计划**：使用 EXPLAIN 查看查询计划
    2. **合理建索引**：避免过多索引，关注选择性
    3. **分库分表**：数据量大时考虑水平拆分
    4. **读写分离**：主库写，从库读，分摊压力