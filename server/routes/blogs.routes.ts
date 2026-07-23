/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';

const router = Router();

router.get('/blogs', BlogController.getBlogs);
router.get('/blogs/:id', BlogController.getBlogById);
router.post('/blogs', BlogController.saveBlog);
router.put('/blogs/:id', BlogController.saveBlog);
router.patch('/blogs/:id', BlogController.saveBlog);
router.delete('/blogs/:id', BlogController.deleteBlog);

export default router;
