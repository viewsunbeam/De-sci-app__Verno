#!/bin/bash

# Verno去中心化科研平台完整测试脚本
# 版本: v1.0.0
# 日期: 2025-10-21

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"
GO_SERVICE_URL="http://localhost:8088"
DATABASE_PATH="$PROJECT_ROOT/desci.db"

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# 日志函数
log_header() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

log_section() {
    echo -e "\n${CYAN}🔍 $1${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
    TEST_RESULTS+=("✅ $1")
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
    TEST_RESULTS+=("❌ $1")
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    TEST_RESULTS+=("⚠️ $1")
}

# 测试函数
test_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    ((TOTAL_TESTS++))
    log_info "测试 $service_name 服务状态..."
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        log_success "$service_name 服务运行正常"
        return 0
    else
        log_error "$service_name 服务不可用"
        return 1
    fi
}

test_api_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local test_name=$3
    local base_url=${4:-$BACKEND_URL}
    
    ((TOTAL_TESTS++))
    log_info "测试 API: $endpoint"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$base_url$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        log_success "$test_name (状态码: $status_code)"
        return 0
    else
        log_error "$test_name (期望: $expected_status, 实际: $status_code)"
        return 1
    fi
}

test_database() {
    ((TOTAL_TESTS++))
    log_info "测试数据库连接和数据完整性..."
    
    if [ -f "$DATABASE_PATH" ]; then
        local db_size=$(ls -la "$DATABASE_PATH" | awk '{print $5}')
        if [ "$db_size" -gt 1000 ]; then
            log_success "数据库文件存在且有数据 (大小: ${db_size} bytes)"
            
            # 测试数据表
            local tables=$(sqlite3 "$DATABASE_PATH" ".tables" 2>/dev/null || echo "")
            if [[ "$tables" == *"users"* && "$tables" == *"projects"* ]]; then
                log_success "核心数据表存在"
                return 0
            else
                log_error "核心数据表缺失"
                return 1
            fi
        else
            log_error "数据库文件过小或损坏"
            return 1
        fi
    else
        log_error "数据库文件不存在"
        return 1
    fi
}

test_frontend_pages() {
    local pages=("/" "/dashboard" "/projects" "/datasets" "/publications" "/reviews" "/nft" "/proof" "/influence" "/verification")
    
    for page in "${pages[@]}"; do
        ((TOTAL_TESTS++))
        log_info "测试前端页面: $page"
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$page" 2>/dev/null || echo "000")
        
        if [ "$status_code" -eq 200 ]; then
            log_success "页面 $page 可访问"
        else
            log_error "页面 $page 不可访问 (状态码: $status_code)"
        fi
    done
}

test_backend_apis() {
    local apis=(
        "/api/users:200:用户管理API"
        "/api/projects:200:项目管理API"
        "/api/datasets:200:数据集管理API"
        "/api/publications:200:论文管理API"
        "/api/reviews:200:评议管理API"
        "/api/nfts:200:NFT管理API"
        "/api/zkproofs:200:零知识证明API"
        "/health:404:健康检查API"
    )
    
    for api_info in "${apis[@]}"; do
        IFS=':' read -r endpoint expected_status name <<< "$api_info"
        test_api_endpoint "$endpoint" "$expected_status" "$name"
    done
}

test_go_service_apis() {
    if test_service "Go服务" "$GO_SERVICE_URL/health"; then
        local apis=(
            "/health:200:Go服务健康检查"
            "/api/hybrid/stats:200:混合统计API"
            "/api/hybrid/nfts:200:混合NFT列表API"
            "/api/hybrid/verify/demo-token-123:200:NFT验证API"
            "/api/hybrid/compare:200:数据源对比API"
        )
        
        for api_info in "${apis[@]}"; do
            IFS=':' read -r endpoint expected_status name <<< "$api_info"
            test_api_endpoint "$endpoint" "$expected_status" "$name" "$GO_SERVICE_URL"
        done
    fi
}

test_file_structure() {
    log_section "测试项目文件结构"
    
    local critical_files=(
        "package.json:项目配置文件"
        "frontend/package.json:前端配置文件"
        "backend/package.json:后端配置文件"
        "services/chain-api/go.mod:Go服务配置"
        "contracts/hardhat.config.js:区块链配置"
        "docker-compose.yml:Docker配置"
        "README.md:项目文档"
    )
    
    for file_info in "${critical_files[@]}"; do
        IFS=':' read -r file_path description <<< "$file_info"
        ((TOTAL_TESTS++))
        
        if [ -f "$PROJECT_ROOT/$file_path" ]; then
            log_success "$description 存在"
        else
            log_error "$description 缺失: $file_path"
        fi
    done
}

test_dependencies() {
    log_section "测试项目依赖"
    
    # 检查Node.js依赖
    ((TOTAL_TESTS++))
    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        log_success "前端依赖已安装"
    else
        log_error "前端依赖未安装"
    fi
    
    ((TOTAL_TESTS++))
    if [ -d "$PROJECT_ROOT/backend/node_modules" ]; then
        log_success "后端依赖已安装"
    else
        log_error "后端依赖未安装"
    fi
    
    # 检查Go依赖
    ((TOTAL_TESTS++))
    if [ -f "$PROJECT_ROOT/services/chain-api/go.sum" ]; then
        log_success "Go服务依赖已安装"
    else
        log_error "Go服务依赖未安装"
    fi
}

test_smart_contracts() {
    log_section "测试智能合约"
    
    local contract_files=(
        "contracts/DeSciPlatform.sol:主平台合约"
        "contracts/ResearchNFT.sol:研究NFT合约"
        "contracts/DatasetManager.sol:数据集管理合约"
        "contracts/ZKPVerifier.sol:零知识证明验证合约"
        "contracts/InfluenceRanking.sol:影响力排名合约"
    )
    
    for contract_info in "${contract_files[@]}"; do
        IFS=':' read -r contract_path description <<< "$contract_info"
        ((TOTAL_TESTS++))
        
        if [ -f "$PROJECT_ROOT/$contract_path" ]; then
            log_success "$description 存在"
        else
            log_error "$description 缺失: $contract_path"
        fi
    done
    
    # 检查编译产物
    ((TOTAL_TESTS++))
    if [ -d "$PROJECT_ROOT/contracts/artifacts" ]; then
        log_success "智能合约编译产物存在"
    else
        log_warning "智能合约编译产物不存在，可能需要编译"
    fi
}

test_performance() {
    log_section "测试系统性能"
    
    if curl -s "$GO_SERVICE_URL/health" > /dev/null 2>&1; then
        # 测试API响应时间
        local endpoints=("/health" "/api/hybrid/stats" "/api/hybrid/nfts")
        
        for endpoint in "${endpoints[@]}"; do
            ((TOTAL_TESTS++))
            log_info "测试 $endpoint 响应时间..."
            
            local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$GO_SERVICE_URL$endpoint" 2>/dev/null || echo "999")
            local time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
            
            if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo "0") )); then
                log_success "$endpoint 响应时间: ${time_ms}ms"
            else
                log_error "$endpoint 响应时间过长: ${time_ms}ms"
            fi
        done
    fi
}

test_security() {
    log_section "测试安全配置"
    
    # 检查环境变量文件
    ((TOTAL_TESTS++))
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        log_success "环境变量示例文件存在"
    else
        log_warning "环境变量示例文件缺失"
    fi
    
    # 检查敏感文件是否被忽略
    ((TOTAL_TESTS++))
    if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        if grep -q "\.env" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
            log_success "敏感文件已配置忽略"
        else
            log_warning "敏感文件可能未正确忽略"
        fi
    else
        log_error ".gitignore 文件缺失"
    fi
}

generate_summary_report() {
    log_header "测试结果汇总"
    
    echo -e "${CYAN}📊 测试统计:${NC}"
    echo "  总测试数: $TOTAL_TESTS"
    echo -e "  通过测试: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "  失败测试: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc 2>/dev/null || echo "0")
    echo "  成功率: ${success_rate}%"
    
    echo -e "\n${CYAN}📋 详细结果:${NC}"
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
    done
    
    echo -e "\n${CYAN}🎯 系统评估:${NC}"
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "  ${GREEN}🎉 系统状态: 优秀${NC}"
        echo -e "  ${GREEN}✅ 竞赛就绪: 是${NC}"
    elif [ $FAILED_TESTS -le 3 ]; then
        echo -e "  ${YELLOW}👍 系统状态: 良好${NC}"
        echo -e "  ${YELLOW}⚠️ 竞赛就绪: 基本就绪，建议修复问题${NC}"
    else
        echo -e "  ${RED}❌ 系统状态: 需要改进${NC}"
        echo -e "  ${RED}🔧 竞赛就绪: 需要修复关键问题${NC}"
    fi
    
    echo -e "\n${CYAN}📝 建议:${NC}"
    if [ $FAILED_TESTS -gt 0 ]; then
        echo "  • 修复失败的测试项目"
        echo "  • 检查服务运行状态"
        echo "  • 验证依赖安装完整性"
    fi
    echo "  • 定期执行完整测试"
    echo "  • 监控系统性能指标"
    echo "  • 保持文档更新"
}

# 主测试流程
main() {
    log_header "Verno去中心化科研平台完整测试"
    echo -e "${BLUE}开始时间: $(date)${NC}"
    echo -e "${BLUE}项目路径: $PROJECT_ROOT${NC}"
    
    # 1. 测试项目结构
    test_file_structure
    
    # 2. 测试依赖
    test_dependencies
    
    # 3. 测试智能合约
    test_smart_contracts
    
    # 4. 测试数据库
    test_database
    
    # 5. 测试服务状态
    log_section "测试服务状态"
    test_service "前端服务" "$FRONTEND_URL"
    test_service "后端服务" "$BACKEND_URL/health"
    test_service "Go服务" "$GO_SERVICE_URL/health"
    
    # 6. 测试前端页面
    if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
        test_frontend_pages
    else
        log_warning "前端服务未运行，跳过页面测试"
    fi
    
    # 7. 测试后端API
    if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
        test_backend_apis
    else
        log_warning "后端服务未运行，跳过API测试"
    fi
    
    # 8. 测试Go服务API
    test_go_service_apis
    
    # 9. 测试性能
    test_performance
    
    # 10. 测试安全配置
    test_security
    
    # 生成汇总报告
    generate_summary_report
    
    # 返回结果
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎊 所有测试通过！Verno平台已准备就绪！${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️ 发现 $FAILED_TESTS 个问题，请检查并修复${NC}"
        exit 1
    fi
}

# 检查依赖工具
check_tools() {
    local tools=("curl" "sqlite3" "bc")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "缺少必要工具: $tool"
            echo "请安装: brew install $tool (macOS) 或 apt-get install $tool (Ubuntu)"
            exit 1
        fi
    done
}

# 执行测试
echo -e "${PURPLE}正在检查测试环境...${NC}"
check_tools
main "$@"
