const express = require('express');
const router = express.Router();
const db = require('../database');

// 获取论文关联的数据集
router.get('/publication/:publicationId/datasets', async (req, res) => {
  const { publicationId } = req.params;
  
  try {
    const datasets = await db.allAsync(`
      SELECT 
        d.*,
        pd.relationship_type,
        pd.description as relationship_description,
        pd.created_at as linked_at
      FROM publication_datasets pd
      JOIN datasets d ON pd.dataset_id = d.id
      WHERE pd.publication_id = ?
      ORDER BY pd.created_at DESC
    `, [publicationId]);
    
    res.json(datasets);
  } catch (error) {
    console.error('Failed to get publication datasets:', error);
    res.status(500).json({ error: 'Failed to get publication datasets' });
  }
});

// 获取数据集关联的论文
router.get('/dataset/:datasetId/publications', async (req, res) => {
  const { datasetId } = req.params;
  
  try {
    const publications = await db.allAsync(`
      SELECT 
        p.*,
        pd.relationship_type,
        pd.description as relationship_description,
        pd.created_at as linked_at
      FROM publication_datasets pd
      JOIN publications p ON pd.publication_id = p.id
      WHERE pd.dataset_id = ?
      ORDER BY pd.created_at DESC
    `, [datasetId]);
    
    res.json(publications);
  } catch (error) {
    console.error('Failed to get dataset publications:', error);
    res.status(500).json({ error: 'Failed to get dataset publications' });
  }
});

// 关联论文和数据集
router.post('/link', async (req, res) => {
  const { publication_id, dataset_id, relationship_type = 'used', description } = req.body;
  
  if (!publication_id || !dataset_id) {
    return res.status(400).json({ error: 'Publication ID and Dataset ID are required' });
  }
  
  try {
    // 检查论文和数据集是否存在
    const publication = await db.getAsync('SELECT id FROM publications WHERE id = ?', [publication_id]);
    const dataset = await db.getAsync('SELECT id FROM datasets WHERE id = ?', [dataset_id]);
    
    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' });
    }
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // 创建关联
    const result = await db.runAsync(`
      INSERT OR REPLACE INTO publication_datasets 
      (publication_id, dataset_id, relationship_type, description)
      VALUES (?, ?, ?, ?)
    `, [publication_id, dataset_id, relationship_type, description]);
    
    res.json({ 
      id: result.lastID,
      publication_id,
      dataset_id,
      relationship_type,
      description,
      message: 'Successfully linked publication and dataset'
    });
  } catch (error) {
    console.error('Failed to link publication and dataset:', error);
    res.status(500).json({ error: 'Failed to link publication and dataset' });
  }
});

// 取消关联
router.delete('/unlink', async (req, res) => {
  const { publication_id, dataset_id } = req.body;
  
  if (!publication_id || !dataset_id) {
    return res.status(400).json({ error: 'Publication ID and Dataset ID are required' });
  }
  
  try {
    const result = await db.runAsync(`
      DELETE FROM publication_datasets 
      WHERE publication_id = ? AND dataset_id = ?
    `, [publication_id, dataset_id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    res.json({ message: 'Successfully unlinked publication and dataset' });
  } catch (error) {
    console.error('Failed to unlink publication and dataset:', error);
    res.status(500).json({ error: 'Failed to unlink publication and dataset' });
  }
});

// 获取用户可关联的数据集（用于论文编辑时选择）
router.get('/user/:userId/available-datasets', async (req, res) => {
  const { userId } = req.params;
  const { publication_id } = req.query;
  
  try {
    let query = `
      SELECT id, name, description, category, created_at
      FROM datasets 
      WHERE owner_id = ?
    `;
    
    const params = [userId];
    
    // 如果指定了论文ID，排除已关联的数据集
    if (publication_id) {
      query += ` AND id NOT IN (
        SELECT dataset_id FROM publication_datasets 
        WHERE publication_id = ?
      )`;
      params.push(publication_id);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const datasets = await db.allAsync(query, params);
    res.json(datasets);
  } catch (error) {
    console.error('Failed to get available datasets:', error);
    res.status(500).json({ error: 'Failed to get available datasets' });
  }
});

module.exports = router;
