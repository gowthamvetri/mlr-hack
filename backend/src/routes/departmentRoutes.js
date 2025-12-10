const express = require('express');
const router = express.Router();
const { 
  getDepartments, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentStats
} = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getDepartments)
  .post(protect, admin, createDepartment);

router.route('/stats').get(protect, admin, getDepartmentStats);

router.route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, admin, updateDepartment)
  .delete(protect, admin, deleteDepartment);

module.exports = router;
