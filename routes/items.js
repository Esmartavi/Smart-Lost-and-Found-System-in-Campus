const express = require('express');
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');
const { verifyToken } = require('./auth');

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  }
});

// Get all items with filters
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 12 } = req.query;
    
    let query = { isResolved: false };
    
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const items = await Item.find(query)
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'username email');
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create item (protected)
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { name, description, category, status, location, contactEmail, contactPhone } = req.body;

    const item = await Item.create({
      name,
      description,
      category,
      status,
      location,
      contactEmail,
      contactPhone,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      reportedBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Item reported successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update item (protected, owner only)
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    if (item.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.file) updates.photo = `/uploads/${req.file.filename}`;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({ success: true, item: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as resolved
router.patch('/:id/resolve', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    if (item.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    item.isResolved = true;
    item.status = 'Claimed';
    await item.save();

    res.json({ success: true, message: 'Item marked as resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete item (protected, owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    if (item.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Item.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's reported items
router.get('/user/my-items', verifyToken, async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
