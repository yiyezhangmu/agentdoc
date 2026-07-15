# DevOps

记录部署、构建、Linux、Jenkins 和运行维护的实践经验。

---

## 📑 知识目录

### CI/CD 流程

- **持续集成**：代码合并、自动构建、单元测试
- **持续部署**：自动化部署、灰度发布、回滚策略
- **Jenkins**：流水线配置、插件生态、最佳实践

### 容器化

- **Docker**：镜像构建、容器编排、网络配置
- **Kubernetes**：Pod、Service、Deployment 基础
- **Helm**：Chart 包管理、应用部署

### Linux 运维

- **系统管理**：用户权限、进程管理、日志分析
- **网络配置**：端口映射、防火墙、负载均衡
- **性能监控**：CPU、内存、磁盘与网络监控

---

## 🔗 核心概念

### CI/CD 流水线

```
代码提交 → 代码审查 → 自动化测试 → 构建镜像 → 部署到测试环境 → 部署到生产环境
```

### Jenkins Pipeline 示例

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'kubectl apply -f deployment.yaml'
            }
        }
    }
}
```

---

## 💡 实践经验

!!! info "运维建议"

    1. **自动化优先**：将重复操作脚本化
    2. **监控告警**：建立完善的监控体系
    3. **版本控制**：基础设施即代码
    4. **安全审计**：定期检查依赖和配置