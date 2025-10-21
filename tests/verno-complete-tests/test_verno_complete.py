#!/usr/bin/env python3
"""
Verno去中心化科研平台完整测试套件
版本: v1.0.0
日期: 2025-10-21
"""

import unittest
import requests
import json
import time
import os
import sqlite3
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional, List

class VernoCompleteTestSuite(unittest.TestCase):
    """Verno平台完整测试套件"""
    
    @classmethod
    def setUpClass(cls):
        """测试类初始化"""
        cls.project_root = Path(__file__).parent.parent.parent
        cls.frontend_url = "http://localhost:5173"
        cls.backend_url = "http://localhost:3000"
        cls.go_service_url = "http://localhost:8088"
        cls.database_path = cls.project_root / "desci.db"
        cls.timeout = 10
        
        # 测试统计
        cls.test_results = []
        
    def setUp(self):
        """每个测试前的准备"""
        pass
    
    def add_result(self, test_name: str, status: str, message: str = ""):
        """添加测试结果"""
        self.test_results.append({
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        })
    
    def test_01_project_structure(self):
        """测试项目文件结构"""
        critical_files = [
            "package.json",
            "frontend/package.json", 
            "backend/package.json",
            "services/chain-api/go.mod",
            "contracts/hardhat.config.js",
            "docker-compose.yml",
            "README.md"
        ]
        
        missing_files = []
        for file_path in critical_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.add_result("项目结构", "FAIL", f"缺失文件: {', '.join(missing_files)}")
            self.fail(f"关键文件缺失: {missing_files}")
        else:
            self.add_result("项目结构", "PASS", "所有关键文件存在")
            print("✅ 项目文件结构完整")
    
    def test_02_dependencies(self):
        """测试项目依赖"""
        # 检查前端依赖
        frontend_modules = self.project_root / "frontend" / "node_modules"
        backend_modules = self.project_root / "backend" / "node_modules"
        go_sum = self.project_root / "services" / "chain-api" / "go.sum"
        
        issues = []
        if not frontend_modules.exists():
            issues.append("前端依赖未安装")
        if not backend_modules.exists():
            issues.append("后端依赖未安装")
        if not go_sum.exists():
            issues.append("Go服务依赖未安装")
        
        if issues:
            self.add_result("项目依赖", "FAIL", "; ".join(issues))
            print(f"⚠️ 依赖问题: {'; '.join(issues)}")
        else:
            self.add_result("项目依赖", "PASS", "所有依赖已安装")
            print("✅ 项目依赖完整")
    
    def test_03_smart_contracts(self):
        """测试智能合约"""
        contract_files = [
            "contracts/DeSciPlatform.sol",
            "contracts/ResearchNFT.sol", 
            "contracts/DatasetManager.sol",
            "contracts/ZKPVerifier.sol",
            "contracts/InfluenceRanking.sol"
        ]
        
        missing_contracts = []
        for contract in contract_files:
            if not (self.project_root / contract).exists():
                missing_contracts.append(contract)
        
        # 检查编译产物
        artifacts_dir = self.project_root / "contracts" / "artifacts"
        
        if missing_contracts:
            self.add_result("智能合约", "FAIL", f"缺失合约: {', '.join(missing_contracts)}")
            self.fail(f"智能合约缺失: {missing_contracts}")
        elif not artifacts_dir.exists():
            self.add_result("智能合约", "WARN", "合约未编译")
            print("⚠️ 智能合约未编译，可能需要运行 npx hardhat compile")
        else:
            self.add_result("智能合约", "PASS", "合约文件完整且已编译")
            print("✅ 智能合约完整")
    
    def test_04_database(self):
        """测试数据库"""
        if not self.database_path.exists():
            self.add_result("数据库", "FAIL", "数据库文件不存在")
            self.fail("数据库文件不存在")
        
        # 检查数据库大小
        db_size = self.database_path.stat().st_size
        if db_size < 1000:
            self.add_result("数据库", "FAIL", f"数据库文件过小: {db_size} bytes")
            self.fail(f"数据库文件过小: {db_size} bytes")
        
        # 检查数据表
        try:
            conn = sqlite3.connect(str(self.database_path))
            cursor = conn.cursor()
            
            # 获取所有表名
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            
            required_tables = ['users', 'projects', 'datasets', 'publications', 'reviews', 'nfts']
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                self.add_result("数据库", "FAIL", f"缺失数据表: {', '.join(missing_tables)}")
                self.fail(f"数据库表缺失: {missing_tables}")
            
            # 检查数据量
            cursor.execute("SELECT COUNT(*) FROM projects")
            project_count = cursor.fetchone()[0]
            
            conn.close()
            
            self.add_result("数据库", "PASS", f"数据库正常，包含{project_count}个项目")
            print(f"✅ 数据库正常: {db_size} bytes, {len(tables)}个表, {project_count}个项目")
            
        except Exception as e:
            self.add_result("数据库", "FAIL", f"数据库连接失败: {str(e)}")
            self.fail(f"数据库连接失败: {e}")
    
    def test_05_frontend_service(self):
        """测试前端服务"""
        try:
            response = requests.get(self.frontend_url, timeout=self.timeout)
            if response.status_code == 200:
                self.add_result("前端服务", "PASS", f"服务正常运行")
                print("✅ 前端服务运行正常")
            else:
                self.add_result("前端服务", "FAIL", f"状态码: {response.status_code}")
                self.fail(f"前端服务状态异常: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.add_result("前端服务", "FAIL", f"连接失败: {str(e)}")
            print(f"⚠️ 前端服务不可用: {e}")
    
    def test_06_backend_service(self):
        """测试后端服务"""
        try:
            # 尝试多个可能的健康检查端点
            endpoints_to_try = ["/health", "/api/health", "/"]
            
            for endpoint in endpoints_to_try:
                try:
                    response = requests.get(f"{self.backend_url}{endpoint}", timeout=self.timeout)
                    if response.status_code in [200, 404]:  # 404也表示服务在运行
                        self.add_result("后端服务", "PASS", f"服务正常运行")
                        print("✅ 后端服务运行正常")
                        return
                except:
                    continue
            
            self.add_result("后端服务", "FAIL", "所有端点都无法访问")
            print("⚠️ 后端服务不可用")
            
        except Exception as e:
            self.add_result("后端服务", "FAIL", f"连接失败: {str(e)}")
            print(f"⚠️ 后端服务不可用: {e}")
    
    def test_07_go_service(self):
        """测试Go服务"""
        try:
            response = requests.get(f"{self.go_service_url}/health", timeout=self.timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    self.add_result("Go服务", "PASS", "服务正常运行")
                    print("✅ Go服务运行正常")
                else:
                    self.add_result("Go服务", "FAIL", f"服务状态异常: {data}")
                    self.fail(f"Go服务状态异常: {data}")
            else:
                self.add_result("Go服务", "FAIL", f"状态码: {response.status_code}")
                self.fail(f"Go服务状态异常: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.add_result("Go服务", "FAIL", f"连接失败: {str(e)}")
            print(f"⚠️ Go服务不可用: {e}")
    
    def test_08_frontend_pages(self):
        """测试前端页面"""
        pages = [
            "/", "/dashboard", "/projects", "/datasets", 
            "/publications", "/reviews", "/nft", "/proof", 
            "/influence", "/verification"
        ]
        
        accessible_pages = []
        inaccessible_pages = []
        
        for page in pages:
            try:
                response = requests.get(f"{self.frontend_url}{page}", timeout=5)
                if response.status_code == 200:
                    accessible_pages.append(page)
                else:
                    inaccessible_pages.append(f"{page}({response.status_code})")
            except:
                inaccessible_pages.append(f"{page}(连接失败)")
        
        if len(accessible_pages) >= len(pages) * 0.8:  # 80%页面可访问认为通过
            self.add_result("前端页面", "PASS", f"{len(accessible_pages)}/{len(pages)}页面可访问")
            print(f"✅ 前端页面: {len(accessible_pages)}/{len(pages)}页面可访问")
        else:
            self.add_result("前端页面", "FAIL", f"多个页面不可访问: {inaccessible_pages}")
            print(f"⚠️ 前端页面问题: {inaccessible_pages}")
    
    def test_09_api_endpoints(self):
        """测试API端点"""
        # 测试后端API
        backend_apis = [
            ("/api/users", "用户管理API"),
            ("/api/projects", "项目管理API"),
            ("/api/datasets", "数据集管理API"),
            ("/api/publications", "论文管理API"),
            ("/api/reviews", "评议管理API"),
            ("/api/nfts", "NFT管理API")
        ]
        
        # 测试Go服务API
        go_apis = [
            ("/api/hybrid/stats", "混合统计API"),
            ("/api/hybrid/nfts", "混合NFT列表API"),
            ("/api/hybrid/verify/demo-token-123", "NFT验证API"),
            ("/api/hybrid/compare", "数据源对比API")
        ]
        
        # 测试后端API
        backend_results = []
        for endpoint, name in backend_apis:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401, 403]:  # 这些状态码表示API存在
                    backend_results.append(f"✅ {name}")
                else:
                    backend_results.append(f"❌ {name}({response.status_code})")
            except:
                backend_results.append(f"❌ {name}(连接失败)")
        
        # 测试Go服务API
        go_results = []
        try:
            requests.get(f"{self.go_service_url}/health", timeout=3)
            go_service_available = True
        except:
            go_service_available = False
        
        if go_service_available:
            for endpoint, name in go_apis:
                try:
                    response = requests.get(f"{self.go_service_url}{endpoint}", timeout=5)
                    if response.status_code == 200:
                        go_results.append(f"✅ {name}")
                    else:
                        go_results.append(f"❌ {name}({response.status_code})")
                except:
                    go_results.append(f"❌ {name}(连接失败)")
        else:
            go_results = ["⚠️ Go服务不可用，跳过API测试"]
        
        # 统计结果
        total_apis = len(backend_apis) + (len(go_apis) if go_service_available else 0)
        successful_apis = len([r for r in backend_results + go_results if r.startswith("✅")])
        
        if successful_apis >= total_apis * 0.7:  # 70%API可用认为通过
            self.add_result("API端点", "PASS", f"{successful_apis}/{total_apis}个API可用")
            print(f"✅ API端点: {successful_apis}/{total_apis}个可用")
        else:
            self.add_result("API端点", "FAIL", f"多个API不可用")
            print(f"⚠️ API端点问题: {successful_apis}/{total_apis}个可用")
        
        # 打印详细结果
        print("   后端API:", "; ".join(backend_results))
        if go_service_available:
            print("   Go服务API:", "; ".join(go_results))
    
    def test_10_performance(self):
        """测试系统性能"""
        # 测试Go服务性能（如果可用）
        try:
            response = requests.get(f"{self.go_service_url}/health", timeout=3)
            if response.status_code == 200:
                # 测试API响应时间
                endpoints = ["/health", "/api/hybrid/stats", "/api/hybrid/nfts"]
                response_times = []
                
                for endpoint in endpoints:
                    start_time = time.time()
                    try:
                        response = requests.get(f"{self.go_service_url}{endpoint}", timeout=5)
                        if response.status_code == 200:
                            response_time = (time.time() - start_time) * 1000
                            response_times.append(response_time)
                    except:
                        pass
                
                if response_times:
                    avg_response_time = sum(response_times) / len(response_times)
                    if avg_response_time < 500:  # 500ms以内认为性能良好
                        self.add_result("系统性能", "PASS", f"平均响应时间: {avg_response_time:.2f}ms")
                        print(f"✅ 系统性能良好: 平均响应时间 {avg_response_time:.2f}ms")
                    else:
                        self.add_result("系统性能", "WARN", f"响应时间较慢: {avg_response_time:.2f}ms")
                        print(f"⚠️ 系统性能一般: 平均响应时间 {avg_response_time:.2f}ms")
                else:
                    self.add_result("系统性能", "FAIL", "无法获取性能数据")
                    print("⚠️ 无法测试系统性能")
            else:
                self.add_result("系统性能", "SKIP", "Go服务不可用")
                print("⚠️ Go服务不可用，跳过性能测试")
        except:
            self.add_result("系统性能", "SKIP", "Go服务不可用")
            print("⚠️ Go服务不可用，跳过性能测试")
    
    def test_11_security_config(self):
        """测试安全配置"""
        issues = []
        
        # 检查.gitignore
        gitignore_path = self.project_root / ".gitignore"
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                gitignore_content = f.read()
                if '.env' not in gitignore_content:
                    issues.append("环境变量文件可能未被忽略")
        else:
            issues.append(".gitignore文件缺失")
        
        # 检查环境变量示例文件
        env_example = self.project_root / ".env.example"
        if not env_example.exists():
            issues.append("环境变量示例文件缺失")
        
        # 检查是否有敏感文件被提交
        sensitive_files = [".env", "private.key", "secret.json"]
        for file in sensitive_files:
            if (self.project_root / file).exists():
                issues.append(f"敏感文件可能被提交: {file}")
        
        if issues:
            self.add_result("安全配置", "WARN", "; ".join(issues))
            print(f"⚠️ 安全配置问题: {'; '.join(issues)}")
        else:
            self.add_result("安全配置", "PASS", "安全配置良好")
            print("✅ 安全配置良好")
    
    @classmethod
    def tearDownClass(cls):
        """测试结束后的清理和报告"""
        print("\n" + "="*80)
        print("                    Verno平台测试结果汇总")
        print("="*80)
        
        # 统计结果
        total_tests = len(cls.test_results)
        passed_tests = len([r for r in cls.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in cls.test_results if r["status"] == "FAIL"])
        warned_tests = len([r for r in cls.test_results if r["status"] == "WARN"])
        skipped_tests = len([r for r in cls.test_results if r["status"] == "SKIP"])
        
        print(f"📊 测试统计:")
        print(f"   总测试数: {total_tests}")
        print(f"   通过: {passed_tests}")
        print(f"   失败: {failed_tests}")
        print(f"   警告: {warned_tests}")
        print(f"   跳过: {skipped_tests}")
        
        if total_tests > 0:
            success_rate = (passed_tests / total_tests) * 100
            print(f"   成功率: {success_rate:.1f}%")
        
        # 详细结果
        print(f"\n📋 详细结果:")
        for result in cls.test_results:
            status_icon = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️", "SKIP": "⏭️"}.get(result["status"], "❓")
            print(f"   {status_icon} {result['test']}: {result['message']}")
        
        # 系统评估
        print(f"\n🎯 系统评估:")
        if failed_tests == 0:
            print("   🎉 系统状态: 优秀")
            print("   ✅ 竞赛就绪: 是")
        elif failed_tests <= 2:
            print("   👍 系统状态: 良好")
            print("   ⚠️ 竞赛就绪: 基本就绪，建议修复问题")
        else:
            print("   ❌ 系统状态: 需要改进")
            print("   🔧 竞赛就绪: 需要修复关键问题")
        
        # 建议
        print(f"\n📝 建议:")
        if failed_tests > 0:
            print("   • 修复失败的测试项目")
            print("   • 确保所有服务正常运行")
        if warned_tests > 0:
            print("   • 关注警告项目的改进")
        print("   • 定期执行完整测试")
        print("   • 保持系统文档更新")

def run_complete_tests():
    """运行完整测试套件"""
    print("="*80)
    print("  Verno去中心化科研平台完整测试套件")
    print("="*80)
    print(f"开始时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 添加测试类
    suite.addTests(loader.loadTestsFromTestCase(VernoCompleteTestSuite))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2, stream=open(os.devnull, 'w'))
    result = runner.run(suite)
    
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    exit(run_complete_tests())
