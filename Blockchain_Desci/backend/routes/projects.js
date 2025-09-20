const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');

// --- Multer Configuration (copied from repository.js) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// --- Original Project Routes ---
// Create a new project
router.post('/', async (req, res) => {
  const { 
    name, 
    description, 
    creator_wallet_address, 
    visibility = 'Private', 
    status = 'Unknown',
    category = 'Other',
    start_date = new Date().toISOString()
  } = req.body;

  try {
    const user = await db.getAsync(
      'SELECT id FROM users WHERE wallet_address = ?',
      [creator_wallet_address]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await db.runAsync(
      `INSERT INTO projects (
        name, description, owner_id, visibility, status, category, start_date, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name, description, user.id, visibility, status, category, start_date]
    );

    const newProject = await db.getAsync(
      'SELECT * FROM projects WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project details with collaborators
router.get('/:id', async (req, res) => {
  try {
    const project = await db.getAsync(`
      SELECT p.*, u.username as owner_username, u.wallet_address as owner_wallet_address
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const collaborators = await db.allAsync(`
      SELECT u.wallet_address, u.username, u.id as user_id,
             pc.role, pc.added_at as joined_at
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      
      UNION
      
      SELECT u.wallet_address, u.username, u.id as user_id,
             'owner' as role, p.created_at as joined_at
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
      
      ORDER BY role DESC, joined_at ASC
    `, [req.params.id, req.params.id]);

    res.json({
      ...project,
      collaborators
    });
  } catch (error) {
    console.error('Failed to get project details:', error);
    res.status(500).json({ error: 'Failed to get project details' });
  }
});

// Add collaborator to project
router.post('/:id/collaborators', async (req, res) => {
  const { wallet_address, role = 'member' } = req.body;
  
  try {
    // Check if user exists
    const user = await db.getAsync(
      'SELECT id FROM users WHERE wallet_address = ?',
      [wallet_address]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already a collaborator
    const existing = await db.getAsync(
      'SELECT 1 FROM project_collaborators WHERE project_id = ? AND user_id = ?',
      [req.params.id, user.id]
    );

    if (existing) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Add collaborator
    await db.runAsync(
      'INSERT INTO project_collaborators (project_id, user_id, role, added_at) VALUES (?, ?, ?, datetime(\'now\'))',
      [req.params.id, user.id, role]
    );

    res.status(201).json({ message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Failed to add collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Remove collaborator from project
router.delete('/:id/collaborators/:userId', async (req, res) => {
  try {
    // Check if trying to remove owner
    const collaborator = await db.getAsync(
      'SELECT role FROM project_collaborators WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );

    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    if (collaborator.role === 'owner') {
      return res.status(403).json({ error: 'Cannot remove project owner' });
    }

    await db.runAsync(
      'DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Failed to remove collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// Get all projects for explore page
router.get('/explore', async (req, res) => {
  try {
    const projects = await db.allAsync(`
      SELECT p.*, u.username as owner_username
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.updated_at DESC
    `);
    res.json(projects);
  } catch (error) {
    console.error('Failed to get projects for explore:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get all public projects for explore page
router.get('/explore/public', async (req, res) => {
  try {
    const projects = await db.allAsync(`
      SELECT 
        p.*,
        u.username as owner_username,
        u.wallet_address as owner_wallet_address,
        COALESCE(
          (SELECT COUNT(*) FROM proofs WHERE project_id = p.id),
          0
        ) as proofs_count,
        COALESCE(
          (SELECT COUNT(*) FROM nfts WHERE project_id = p.id),
          0
        ) as nfts_count,
        CASE 
          WHEN EXISTS(SELECT 1 FROM nfts WHERE project_id = p.id) THEN 1
          ELSE 0
        END as has_nft,
        COALESCE(p.like_count, 0) as like_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.visibility = 'Public' 
         OR (p.visibility = 'Private' AND EXISTS(SELECT 1 FROM nfts WHERE project_id = p.id))
      ORDER BY p.updated_at DESC
    `);

    // Format the response
    const formattedProjects = projects.map(project => ({
      ...project,
      owner: project.owner_username || '@' + project.owner_wallet_address.slice(2, 8),
      updatedAt: new Date(project.updated_at).toISOString(),
      startDate: new Date(project.start_date).toISOString()
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Failed to get public projects:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get recommended projects based on user interests
router.get('/explore/recommendations', async (req, res) => {
  try {
    const { user_id, limit = 20, offset = 0 } = req.query;
    
    if (user_id) {
      // Get user's research interests
      const user = await db.getAsync('SELECT research_interests FROM users WHERE id = ?', [user_id]);
      
      if (user && user.research_interests) {
        try {
          const userInterests = JSON.parse(user.research_interests);
          
          if (Array.isArray(userInterests) && userInterests.length > 0) {
            // Find projects with matching interests based on category, description, or name
            const searchConditions = [];
            const searchParams = [];
            
            // Search in category (exact match, case insensitive)
            userInterests.forEach(interest => {
              searchConditions.push('LOWER(p.category) LIKE ?');
              searchParams.push(`%${interest.toLowerCase()}%`);
            });
            
            // Search in name and description (partial match)
            userInterests.forEach(interest => {
              searchConditions.push('LOWER(p.name) LIKE ?');
              searchConditions.push('LOWER(p.description) LIKE ?');
              searchParams.push(`%${interest.toLowerCase()}%`);
              searchParams.push(`%${interest.toLowerCase()}%`);
            });
            
            // First try to find projects from other users
            let recommendedProjects = await db.allAsync(`
              SELECT 
                p.*,
                u.username as owner_username,
                u.wallet_address as owner_wallet_address,
                COALESCE(
                  (SELECT COUNT(*) FROM proofs WHERE project_id = p.id),
                  0
                ) as proofs_count,
                COALESCE(
                  (SELECT COUNT(*) FROM nfts WHERE project_id = p.id),
                  0
                ) as nfts_count
              FROM projects p
              JOIN users u ON p.owner_id = u.id
              WHERE p.visibility = 'Public' 
                AND p.owner_id != ?
                AND (${searchConditions.join(' OR ')})
              ORDER BY p.updated_at DESC
              LIMIT ? OFFSET ?
            `, [user_id, ...searchParams, parseInt(limit), parseInt(offset)]);
            
            // If no results from other users, include all matching projects (including own)
            if (recommendedProjects.length === 0 && offset === 0) {
              recommendedProjects = await db.allAsync(`
                SELECT 
                  p.*,
                  u.username as owner_username,
                  u.wallet_address as owner_wallet_address,
                  COALESCE(
                    (SELECT COUNT(*) FROM proofs WHERE project_id = p.id),
                    0
                  ) as proofs_count,
                  COALESCE(
                    (SELECT COUNT(*) FROM nfts WHERE project_id = p.id),
                    0
                  ) as nfts_count
                FROM projects p
                JOIN users u ON p.owner_id = u.id
                WHERE p.visibility = 'Public' 
                  AND (${searchConditions.join(' OR ')})
                ORDER BY p.updated_at DESC
                LIMIT ? OFFSET ?
              `, [...searchParams, parseInt(limit), parseInt(offset)]);
            }
            
            if (recommendedProjects.length > 0) {
              const formattedRecommendations = recommendedProjects.map(project => ({
                ...project,
                owner: project.owner_username || '@' + project.owner_wallet_address.slice(2, 8),
                updatedAt: new Date(project.updated_at).toISOString(),
                startDate: new Date(project.start_date).toISOString()
              }));
              
              return res.json(formattedRecommendations);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse user interests:', parseError);
        }
      }
    }
    
    // Fallback: return random projects (excluding user's own projects if user_id provided)
    const randomProjects = await db.allAsync(`
      SELECT 
        p.*,
        u.username as owner_username,
        u.wallet_address as owner_wallet_address,
        COALESCE(
          (SELECT COUNT(*) FROM proofs WHERE project_id = p.id),
          0
        ) as proofs_count,
        COALESCE(
          (SELECT COUNT(*) FROM nfts WHERE project_id = p.id),
          0
        ) as nfts_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.visibility = 'Public' 
        ${user_id ? 'AND p.owner_id != ?' : ''}
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?
    `, user_id ? [user_id, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]);
    
    const formattedRandomProjects = randomProjects.map(project => ({
      ...project,
      owner: project.owner_username || '@' + project.owner_wallet_address.slice(2, 8),
      updatedAt: new Date(project.updated_at).toISOString(),
      startDate: new Date(project.start_date).toISOString()
    }));
    
    res.json(formattedRandomProjects);
  } catch (error) {
    console.error('Failed to get recommended projects:', error);
    res.status(500).json({ error: 'Failed to get recommended projects' });
  }
});

// Update project details
router.put('/:id', async (req, res) => {
  const { 
    name, 
    description, 
    visibility = 'Private', 
    status = 'Unknown',
    category
  } = req.body;

  try {
    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (visibility) {
      updateFields.push('visibility = ?');
      params.push(visibility);
    }
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (category) {
      updateFields.push('category = ?');
      params.push(category);
    }

    updateFields.push('updated_at = datetime(\'now\')');
    params.push(req.params.id);

    const query = `
      UPDATE projects 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await db.runAsync(query, params);
    
    const updatedProject = await db.getAsync(
      'SELECT * FROM projects WHERE id = ?', 
      [req.params.id]
    );
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Get user's projects
router.get('/', async (req, res) => {
  const { wallet_address } = req.query;
  
  if (!wallet_address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    // Get user by wallet address
    const user = await db.getAsync('SELECT id FROM users WHERE wallet_address = ?', [wallet_address]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all projects where user is owner or collaborator
    const projects = await db.allAsync(`
      SELECT DISTINCT p.*, u.username as owner_username, u.wallet_address as owner_wallet_address,
             CASE 
               WHEN p.owner_id = ? THEN 'owner'
               ELSE pc.role
             END as user_role
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE p.owner_id = ? OR pc.user_id = ?
      ORDER BY p.updated_at DESC
    `, [user.id, user.id, user.id, user.id]);

    res.json(projects);
  } catch (error) {
    console.error('Failed to get user projects:', error);
    res.status(500).json({ error: 'Failed to get user projects' });
  }
});

// --- Repository Routes (copied and pasted here) ---

// Matches: GET /api/projects/:projectId/repository
router.get('/:projectId/repository', async (req, res) => {
  const { projectId } = req.params;
  const { parentId } = req.query; 
  try {
    const sql = `
      SELECT * FROM project_files 
      WHERE project_id = ? AND (parent_id = ? OR (? IS NULL AND parent_id IS NULL))
      ORDER BY file_type DESC, file_name ASC
    `;
    const files = await db.allAsync(sql, [projectId, parentId, parentId]);
    res.json(files);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    res.status(500).json({ error: 'Failed to fetch files.' });
  }
});

// Matches: POST /api/projects/:projectId/repository/folders
router.post('/:projectId/repository/folders', async (req, res) => {
    const { projectId } = req.params;
    const { name, parent_id, uploader_wallet_address } = req.body;
    try {
        const uploader = await db.getAsync('SELECT id FROM users WHERE wallet_address = ?', [uploader_wallet_address]);
        if (!uploader) {
            return res.status(404).json({ error: 'Uploader not found.' });
        }
        const sql = `
            INSERT INTO project_files (project_id, parent_id, uploader_id, file_name, file_type) 
            VALUES (?, ?, ?, ?, 'directory')
        `;
        await db.runAsync(sql, [projectId, parent_id || null, uploader.id, name]);
        res.status(201).json({ message: 'Folder created successfully.' });
    } catch (error) {
        console.error('Failed to create folder:', error);
        res.status(500).json({ error: 'Failed to create folder.' });
    }
});

// Matches: POST /api/projects/:projectId/repository/files
router.post('/:projectId/repository/files', upload.array('files'), async (req, res) => {
  const { projectId } = req.params;
  const { parent_id, uploader_wallet_address } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  try {
    const uploader = await db.getAsync('SELECT id FROM users WHERE wallet_address = ?', [uploader_wallet_address]);
    if (!uploader) {
      return res.status(404).json({ error: 'Uploader not found.' });
    }
    const filePromises = req.files.map(file => {
      const sql = `
        INSERT INTO project_files 
        (project_id, parent_id, uploader_id, file_name, file_path, file_size, file_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      return db.runAsync(sql, [
        projectId,
        parent_id || null,
        uploader.id,
        file.originalname,
        path.join('uploads', file.filename),
        file.size,
        'file' 
      ]);
    });
    await Promise.all(filePromises);
    res.status(201).json({ message: 'Files uploaded successfully.' });
  } catch (error) {
    console.error('Failed to upload files:', error);
    res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

// --- Milestone Routes ---

// Get all milestones for a project
router.get('/:projectId/milestones', async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const milestones = await db.allAsync(`
      SELECT m.*, u.username as creator_username, u.wallet_address as creator_wallet_address
      FROM milestones m
      JOIN users u ON m.creator_id = u.id
      WHERE m.project_id = ?
      ORDER BY date DESC
    `, [projectId]);

    res.json(milestones);
  } catch (error) {
    console.error('Failed to get milestones:', error);
    res.status(500).json({ error: 'Failed to get milestones' });
  }
});

// Create a new milestone
router.post('/:projectId/milestones', async (req, res) => {
  const { projectId } = req.params;
  const { title, description, type, date, status, creator_wallet_address } = req.body;

  if (!title || !type || !date || !creator_wallet_address) {
    return res.status(400).json({ error: 'Title, type, date, and creator wallet address are required' });
  }

  try {
    // Find user by wallet address
    const user = await db.getAsync('SELECT id FROM users WHERE wallet_address = ?', [creator_wallet_address]);
    if (!user) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Create milestone
    const result = await db.runAsync(`
      INSERT INTO milestones (project_id, title, description, type, date, status, creator_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [projectId, title, description, type, date, status || 'planned', user.id]);

    // Get the created milestone with creator info
    const newMilestone = await db.getAsync(`
      SELECT m.*, u.username as creator_username, u.wallet_address as creator_wallet_address
      FROM milestones m
      JOIN users u ON m.creator_id = u.id
      WHERE m.id = ?
    `, [result.lastID]);

    res.status(201).json(newMilestone);
  } catch (error) {
    console.error('Failed to create milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Update a milestone
router.put('/:projectId/milestones/:milestoneId', async (req, res) => {
  const { projectId, milestoneId } = req.params;
  const { title, description, type, date, status } = req.body;

  try {
    // Check if milestone exists and belongs to the project
    const existingMilestone = await db.getAsync(
      'SELECT id FROM milestones WHERE id = ? AND project_id = ?',
      [milestoneId, projectId]
    );

    if (!existingMilestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Update milestone
    await db.runAsync(`
      UPDATE milestones 
      SET title = ?, description = ?, type = ?, date = ?, status = ?, updated_at = datetime('now')
      WHERE id = ? AND project_id = ?
    `, [title, description, type, date, status, milestoneId, projectId]);

    // Get updated milestone with creator info
    const updatedMilestone = await db.getAsync(`
      SELECT m.*, u.username as creator_username, u.wallet_address as creator_wallet_address
      FROM milestones m
      JOIN users u ON m.creator_id = u.id
      WHERE m.id = ?
    `, [milestoneId]);

    res.json(updatedMilestone);
  } catch (error) {
    console.error('Failed to update milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Delete a milestone
router.delete('/:projectId/milestones/:milestoneId', async (req, res) => {
  const { projectId, milestoneId } = req.params;

  try {
    // Check if milestone exists and belongs to the project
    const existingMilestone = await db.getAsync(
      'SELECT id FROM milestones WHERE id = ? AND project_id = ?',
      [milestoneId, projectId]
    );

    if (!existingMilestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Delete milestone
    await db.runAsync('DELETE FROM milestones WHERE id = ? AND project_id = ?', [milestoneId, projectId]);

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Failed to delete milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// Get project NFT status
router.get('/:projectId/nft', async (req, res) => {
  const { projectId } = req.params;

  try {
    // Check if project exists
    const project = await db.getAsync(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if NFT exists for this project
    const nft = await db.getAsync(
      `SELECT n.*, u.username as owner_username, u.wallet_address as owner_wallet_address 
       FROM nfts n 
       JOIN users u ON n.owner_id = u.id 
       WHERE n.project_id = ?`,
      [projectId]
    );

    if (nft) {
      // Parse metadata if it exists
      let metadata = {};
      try {
        metadata = nft.metadata_uri ? JSON.parse(nft.metadata_uri) : {};
      } catch (error) {
        console.error('Failed to parse NFT metadata:', error);
      }

      const nftData = {
        id: nft.id,
        tokenId: nft.token_id,
        contractAddress: nft.contract_address,
        metadata: metadata,
        owner: {
          id: nft.owner_id,
          username: nft.owner_username,
          walletAddress: nft.owner_wallet_address
        },
        mintedAt: nft.created_at,
        // Extract common metadata fields
        title: metadata.title || project.name,
        description: metadata.description || project.description,
        image: metadata.image,
        price: metadata.price || 0,
        royalty: metadata.royalty || 0,
        tags: metadata.tags || [],
        views: metadata.views || 0
      };

      res.json({
        hasNFT: true,
        project: {
          id: project.id,
          title: project.name,
          description: project.description,
          status: project.status,
          category: project.category,
          isCompleted: project.status === 'Completed'
        },
        nft: nftData
      });
    } else {
      res.json({
        hasNFT: false,
        project: {
          id: project.id,
          title: project.name,
          description: project.description,
          status: project.status,
          category: project.category,
          isCompleted: project.status === 'Completed'
        },
        nft: null
      });
    }
  } catch (error) {
    console.error('Failed to get project NFT:', error);
    res.status(500).json({ error: 'Failed to get project NFT' });
  }
});

// Mint project as NFT
router.post('/:projectId/nft/mint', async (req, res) => {
  const { projectId } = req.params;
  const {
    title,
    description,
    price = 0,
    royalty = 0,
    tags = [],
    walletAddress
  } = req.body;

  if (!title || !description || !walletAddress) {
    return res.status(400).json({ 
      error: 'Title, description, and wallet address are required' 
    });
  }

  try {
    // Check if project exists and is completed
    const project = await db.getAsync(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'Completed') {
      return res.status(400).json({ 
        error: 'Project must be completed before minting as NFT' 
      });
    }

    // If project is public, it must have open access for NFT minting
    if (project.visibility === 'Public' && price > 0) {
      return res.status(400).json({ 
        error: 'Public projects must have open access (price = 0) when minting NFTs. Cannot set price for public projects.' 
      });
    }

    // Check if NFT already exists for this project
    const existingNFT = await db.getAsync(
      'SELECT id FROM nfts WHERE project_id = ?',
      [projectId]
    );

    if (existingNFT) {
      return res.status(400).json({ 
        error: 'NFT already exists for this project' 
      });
    }

    // Get user ID
    const user = await db.getAsync(
      'SELECT id FROM users WHERE wallet_address = ?',
      [walletAddress]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate mock token ID and contract address
    const tokenId = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;
    const contractAddress = '0x1234567890abcdef1234567890abcdef12345678'; // Mock contract address

    // Create metadata
    const metadata = {
      title,
      description,
      image: `https://via.placeholder.com/400x300/1a1a2e/eee?text=${encodeURIComponent(title)}`,
      price,
      royalty,
      tags,
      views: 0,
      projectId: parseInt(projectId),
      mintedAt: new Date().toISOString()
    };

    // Insert NFT record
    const result = await db.runAsync(
      `INSERT INTO nfts (
        project_id, token_id, contract_address, metadata_uri, owner_id, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [projectId, tokenId, contractAddress, JSON.stringify(metadata), user.id]
    );

    // Get the created NFT with owner info
    const newNFT = await db.getAsync(
      `SELECT n.*, u.username as owner_username, u.wallet_address as owner_wallet_address 
       FROM nfts n 
       JOIN users u ON n.owner_id = u.id 
       WHERE n.id = ?`,
      [result.lastID]
    );

    const nftData = {
      id: newNFT.id,
      tokenId: newNFT.token_id,
      contractAddress: newNFT.contract_address,
      metadata: metadata,
      owner: {
        id: newNFT.owner_id,
        username: newNFT.owner_username,
        walletAddress: newNFT.owner_wallet_address
      },
      mintedAt: newNFT.created_at,
      ...metadata // Spread metadata fields for easy access
    };

    res.status(201).json({
      message: 'Project successfully minted as NFT',
      nft: nftData
    });

  } catch (error) {
    console.error('Failed to mint project NFT:', error);
    res.status(500).json({ error: 'Failed to mint project NFT' });
  }
});

// Update NFT metadata (for listing, price changes, etc.)
router.put('/:projectId/nft', async (req, res) => {
  const { projectId } = req.params;
  const { price, status, views, ...otherUpdates } = req.body;

  try {
    // Get existing NFT
    const nft = await db.getAsync(
      'SELECT * FROM nfts WHERE project_id = ?',
      [projectId]
    );

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found for this project' });
    }

    // Parse existing metadata
    let metadata = {};
    try {
      metadata = JSON.parse(nft.metadata_uri || '{}');
    } catch (error) {
      console.error('Failed to parse existing metadata:', error);
    }

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      ...otherUpdates,
      ...(price !== undefined && { price }),
      ...(status !== undefined && { status }),
      ...(views !== undefined && { views }),
      updatedAt: new Date().toISOString()
    };

    // Update NFT record
    await db.runAsync(
      'UPDATE nfts SET metadata_uri = ? WHERE project_id = ?',
      [JSON.stringify(updatedMetadata), projectId]
    );

    res.json({
      message: 'NFT updated successfully',
      metadata: updatedMetadata
    });

  } catch (error) {
    console.error('Failed to update NFT:', error);
    res.status(500).json({ error: 'Failed to update NFT' });
  }
});

// Get NFTs for a specific project
router.get('/:projectId/nfts', async (req, res) => {
  const { projectId } = req.params;

  try {
    // Get all NFTs for this project
    const nfts = await db.allAsync(`
      SELECT 
        n.*,
        u.username as owner_username,
        u.wallet_address as owner_wallet_address
      FROM nfts n
      JOIN users u ON n.owner_id = u.id
      WHERE n.project_id = ?
      ORDER BY n.created_at DESC
    `, [projectId]);

    // Parse metadata and format response
    const formattedNFTs = nfts.map(nft => {
      let metadata = {};
      try {
        metadata = JSON.parse(nft.metadata_uri || '{}');
      } catch (error) {
        console.error('Failed to parse NFT metadata:', error);
      }

      return {
        id: nft.id,
        token_id: nft.token_id,
        contract_address: nft.contract_address,
        asset_type: nft.asset_type,
        project_id: nft.project_id,
        owner_id: nft.owner_id,
        owner_username: nft.owner_username,
        owner_wallet_address: nft.owner_wallet_address,
        created_at: nft.created_at,
        // Extract metadata fields
        title: metadata.title,
        description: metadata.description,
        price: metadata.price,
        status: metadata.status,
        views: metadata.views || 0,
        image: metadata.image,
        openAccess: metadata.openAccess,
        accessPrice: metadata.accessPrice,
        ...metadata
      };
    });

    res.json(formattedNFTs);
  } catch (error) {
    console.error('Failed to get project NFTs:', error);
    res.status(500).json({ error: 'Failed to get project NFTs' });
  }
});

module.exports = router; 