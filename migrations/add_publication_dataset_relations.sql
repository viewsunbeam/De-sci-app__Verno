-- 创建论文-数据集关联表
CREATE TABLE IF NOT EXISTS publication_datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publication_id INTEGER NOT NULL,
    dataset_id INTEGER NOT NULL,
    relationship_type TEXT DEFAULT 'used', -- 'used', 'generated', 'referenced'
    description TEXT, -- 可选的关系描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(publication_id, dataset_id), -- 防止重复关联
    FOREIGN KEY (publication_id) REFERENCES publications (id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_publication_datasets_pub ON publication_datasets(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_datasets_dataset ON publication_datasets(dataset_id);
CREATE INDEX IF NOT EXISTS idx_publication_datasets_type ON publication_datasets(relationship_type);
