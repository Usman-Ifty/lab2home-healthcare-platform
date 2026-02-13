import { Request, Response } from 'express';
import Test from '../models/Test';

// ============================================
// GET ALL TESTS (Public - for patients and labs)
// ============================================
export const getAllTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, isActive } = req.query;

        // Build query
        const query: any = {};
        if (category) {
            query.category = category;
        }
        if (req.query.includeInactive === 'true') {
            delete query.isActive;
        } else if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        } else {
            // By default, only show active tests
            query.isActive = true;
        }

        const tests = await Test.find(query).sort({ category: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: tests.length,
            data: tests,
        });
    } catch (error: any) {
        console.error('Get all tests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tests',
            error: error.message,
        });
    }
};

// ============================================
// GET TEST BY ID
// ============================================
export const getTestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);

        if (!test) {
            res.status(404).json({
                success: false,
                message: 'Test not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error: any) {
        console.error('Get test by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test',
            error: error.message,
        });
    }
};

// ============================================
// CREATE TEST (Admin only)
// ============================================
export const createTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, category, basePrice, preparationInstructions, reportDeliveryTime, sampleType } = req.body;

        // Validate required fields
        if (!name || !description || !category || !basePrice || !reportDeliveryTime) {
            res.status(400).json({
                success: false,
                message: 'Name, description, category, base price, and report delivery time are required',
            });
            return;
        }

        // Check if test already exists
        const existingTest = await Test.findOne({ name: name.trim() });
        if (existingTest) {
            res.status(400).json({
                success: false,
                message: 'Test with this name already exists',
            });
            return;
        }

        // Create new test
        const test = new Test({
            name: name.trim(),
            description: description.trim(),
            category,
            basePrice,
            preparationInstructions,
            reportDeliveryTime,
            sampleType,
            isActive: true,
        });

        await test.save();

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: test,
        });
    } catch (error: any) {
        console.error('Create test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test',
            error: error.message,
        });
    }
};

// ============================================
// UPDATE TEST (Admin only)
// ============================================
export const updateTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, category, basePrice, preparationInstructions, reportDeliveryTime, sampleType, isActive } = req.body;

        const test = await Test.findById(id);

        if (!test) {
            res.status(404).json({
                success: false,
                message: 'Test not found',
            });
            return;
        }

        // Update fields
        if (name) test.name = name.trim();
        if (description) test.description = description.trim();
        if (category) test.category = category;
        if (basePrice !== undefined) test.basePrice = basePrice;
        if (preparationInstructions !== undefined) test.preparationInstructions = preparationInstructions;
        if (reportDeliveryTime) test.reportDeliveryTime = reportDeliveryTime;
        if (sampleType !== undefined) test.sampleType = sampleType;
        if (isActive !== undefined) test.isActive = isActive;

        await test.save();

        res.status(200).json({
            success: true,
            message: 'Test updated successfully',
            data: test,
        });
    } catch (error: any) {
        console.error('Update test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update test',
            error: error.message,
        });
    }
};

// ============================================
// DELETE TEST (Soft delete - Admin only)
// ============================================
export const deleteTest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);

        if (!test) {
            res.status(404).json({
                success: false,
                message: 'Test not found',
            });
            return;
        }

        // Soft delete - just mark as inactive
        test.isActive = false;
        await test.save();

        res.status(200).json({
            success: true,
            message: 'Test deactivated successfully',
            data: test,
        });
    } catch (error: any) {
        console.error('Delete test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete test',
            error: error.message,
        });
    }
};

// ============================================
// GET TEST CATEGORIES
// ============================================
export const getTestCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await Test.distinct('category', { isActive: true });

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        console.error('Get test categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test categories',
            error: error.message,
        });
    }
};
