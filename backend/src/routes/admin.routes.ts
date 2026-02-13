import { Router } from 'express';
import {
    getDashboardStats,
    getPendingLabs,
    getAllLabs,
    getLabById,
    getLabLicense,
    approveLab,
    rejectLab,
    editLabProfile,
    removeLab,
    activateLab,
    deactivateLab,
    getPendingPhlebotomists,
    getAllPhlebotomists,
    getPhlebotomistById,
    getPhlebotomistLicense,
    approvePhlebotomist,
    rejectPhlebotomist,
    activatePhlebotomist,
    deactivatePhlebotomist,
    editPhlebotomistProfile,
    removePhlebotomist,
    getAllPatients,
    getPatientById,
    activatePatient,
    deactivatePatient
} from '../controllers/admin.controller';
import { protect, authorizeUserType } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorizeUserType('admin'));

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Lab management
router.get('/labs/pending', getPendingLabs);
router.get('/labs', getAllLabs);
router.get('/labs/:id', getLabById);
router.get('/labs/:id/license', getLabLicense);
router.put('/labs/:id/approve', approveLab);
router.put('/labs/:id/reject', rejectLab);
router.put('/labs/:id/edit', editLabProfile);
router.put('/labs/:id/activate', activateLab);
router.put('/labs/:id/deactivate', deactivateLab);
router.delete('/labs/:id', removeLab);

// Phlebotomist management
router.get('/phlebotomists/pending', getPendingPhlebotomists);
router.get('/phlebotomists', getAllPhlebotomists);
router.get('/phlebotomists/:id', getPhlebotomistById);
router.get('/phlebotomists/:id/license', getPhlebotomistLicense);
router.put('/phlebotomists/:id/approve', approvePhlebotomist);
router.put('/phlebotomists/:id/reject', rejectPhlebotomist);
router.put('/phlebotomists/:id/activate', activatePhlebotomist);
router.put('/phlebotomists/:id/deactivate', deactivatePhlebotomist);
router.put('/phlebotomists/:id/edit', editPhlebotomistProfile);
router.delete('/phlebotomists/:id', removePhlebotomist);

// Patient management
router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientById);
router.put('/patients/:id/activate', activatePatient);
router.put('/patients/:id/deactivate', deactivatePatient);

export default router;
