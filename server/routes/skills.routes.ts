/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';

const router = Router();

router.get('/skills', SkillController.getSkills);
router.get('/skills/:id', SkillController.getSkillById);
router.post('/skills', SkillController.createSkill);
router.patch('/skills/:id', SkillController.updateSkill);
router.put('/skills/:id', SkillController.updateSkill);
router.delete('/skills/:id', SkillController.deleteSkill);

export default router;
