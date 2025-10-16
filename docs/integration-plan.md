# Verno DeSci Platform – Integration Plan

## 1. Competition Context
- Project: **Verno 去中心化科研平台**
- Event: **CCF 第四届大学生区块链技术与创新应用竞赛**
- Team: Zhou Ziwei, Zhang Jiachang, Zhu Yanqi, Li Jianing
- Objective: Deliver a production-quality hybrid DeSci platform that demonstrates on-chain credibility, off-chain performance, and privacy guarantees.

## 2. Repositories Assessed

| Repo | Branch | Highlights | Gaps |
| --- | --- | --- | --- |
| `viewsunbeam/De-sci-app__Verno` | `main` (current checkout) | Vue + Naive UI SPA, Express/SQLite backend, basic Hardhat setup, deployment helper scripts | Blockchain service stub (lazy init), no deterministic ABI sharing, limited event coverage, console lacks deep observability |
| `zzw4257/De-Sci-hardhat` | `feat/project-cleanup-and-final` | Hardened contracts (OZ 5.x), extended deployment scripts, Go backend with event-driven sync + REST API, React/RainbowKit operations console, comprehensive docs & test harnesses | Lives as standalone repo, folder layout diverges, ABI/config sync not prepared for monorepo, assumes Postgres |

## 3. Target Architecture Overview
```
apps/
  frontend-vue/        (existing research/workflow UX)
  console-react/       (blockchain observability console from Hardhat repo)
  api-node/            (current Express service; will call Go API for chain data)
  api-go/              (Go listener + REST API from Hardhat repo)
blockchain/            (Hardhat workspace with shared contracts/scripts)
docs/                  (competition deliverables, runbooks, specs)
ops/                   (docker-compose, env templates, helper scripts)
```
- **Shared Contracts:** single Hardhat project under `blockchain/` with `scripts/copy-abis.js` to distribute ABIs/addresses into both backends and UIs.
- **Event Sync:** Go service consumes Hardhat events, persists to Postgres/SQLite (configurable), exposes REST aligned with competition endpoints.
- **Node API:** continues handling project/dataset CRUD, proxies blockchain read requests to Go API when blockchain mode is enabled.
- **Frontends:** Vue app remains customer-facing; React console exposes chain state, event logs, and verification workflows for judges.
- **Documentation:** root `README` becomes high-level, per-app readme lives in respective directories, competition kit added to `docs/`.

## 4. Migration Phases
1. **Bootstrap feat branch**
   - Create `feat` branch in `viewsunbeam/De-sci-app__Verno`.
   - Add submodules/modules as plain folders (no git submodule) for Go backend + Hardhat console.
   - Wire root `package.json` scripts to new layout (`npm run bootstrap`, `npm run dev:all`).
2. **Blockchain Layer Alignment**
   - Replace `contracts/` + `hardhat.config.js` with upgraded versions (OZ 5.x).
   - Move deployment/test scripts into `blockchain/scripts/`.
   - Implement `copy-abis` to sync ABI + deployment JSON into `apps/*/shared/contracts`.
   - Update documentation for deployment flow (`npm run chain:up`, `npm run chain:deploy`).
3. **Backend Integration**
   - Relocate existing Express app to `apps/api-node`.
   - Import Go backend under `apps/api-go`; create shared `.env.example`.
   - Introduce shared database migrations (SQLite default, Postgres optional).
   - Add service discovery config: Node reads `CHAIN_API_BASE_URL`, falls back gracefully when Go service offline.
4. **Frontend Consolidation**
   - Move current Vue code to `apps/frontend-vue`; adjust Vite config to read ABI from shared folder.
   - Integrate React console under `apps/console-react`; ensure environment variables align with Hardhat deployment outputs.
   - Create unified start script (e.g., `pnpm dev --filter ...`) or compose-based dev launcher.
5. **Observability & QA**
   - Add Docker Compose for deterministic dev stack (Hardhat node + Go API + Postgres + Node API + both frontends).
   - Port Hardhat tests and Go integration tests into CI (GitHub Actions workflow).
   - Document manual verification steps for competition demo.

## 5. Immediate Action Items
- [ ] Rename and relocate existing backend/frontend folders per target layout.
- [x] Import Go backend + console assets; ensure lint/build still pass.
- [x] Upgrade Hardhat dependencies and reconcile Solidity compiler options.
- [x] Generate ABI sync script + update Express service to consume shared artifacts.
- [x] Prepare `.env.example` and `docs/setup-guide.md` covering full stack startup.

## 6. Risk & Mitigation
- **Dependency Drift:** Hardhat/OZ major version bump may break contracts → run full test suite after migration, keep old tag for rollback.
- **Database Choice:** Go backend defaults to Postgres, original stack uses SQLite → support SQLite via config (already handled in repo) and document Postgres path.
- **Dual Backend Complexity:** Ensure routing tables do not conflict; use per-service ports and CORS allowances.
- **Time Constraints:** Focus on chain–API integration before UI polish; ship skeleton docs early for teammates.

## 7. Deliverables Checklist for `feat` Branch
- Unified repository layout with updated package scripts.
- Working Hardhat deployment pipeline and synchronized ABI artifacts.
- Go REST API accessible at `/api/research/*` endpoints, validated via curl commands supplied in competition brief.
- Enhanced console (React) exposing event logs, contract metrics, and verification actions.
- Frontend competition-mode copy and navigation tuned for CCF judging.
- Updated documentation set (`README`, setup guide, architecture overview, competition statement).
- Docker Compose stack enabling one-command startup for Hardhat, backend, chain sync, and frontend services.
- Git history with structured conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`) describing each milestone.
