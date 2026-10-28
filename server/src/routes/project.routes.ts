import { Router } from 'express';
import { Project, ProjectMilestone, type ProjectStatus, type TeamMemberRole } from '../models/Project.js';
import { User } from '../models/User.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';
import { isFacultyOrAdmin } from '../middleware/rbac.js';
import { logAudit } from '../services/auditService.js';
import { sendNotification } from '../services/notificationService.js';

const router = Router();

// GET /api/projects
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { search, status, category, facultyMentor, myProjectsOnly, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { projectName: { $regex: String(search), $options: 'i' } },
        { projectCode: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { problemStatement: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (facultyMentor) {
      query.facultyMentor = facultyMentor;
    }

    if (myProjectsOnly === 'true') {
      query.$or = [{ createdBy: req.user!._id }, { 'teamMembers.user': req.user!._id }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('facultyMentor', 'fullName email department')
        .populate('createdBy', 'fullName email collegeId')
        .populate('teamMembers.user', 'fullName email collegeId department avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: projects,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('facultyMentor', 'fullName email department')
      .populate('createdBy', 'fullName email collegeId department')
      .populate('teamMembers.user', 'fullName email collegeId department year avatarUrl')
      .populate('feedback.faculty', 'fullName email department');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const milestones = await ProjectMilestone.find({ project: project._id })
      .populate('assignedMembers', 'fullName collegeId')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        project,
        milestones,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects (Create new proposal)
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      projectName,
      problemStatement,
      description,
      objectives,
      category,
      facultyMentor,
      budget,
      repositoryUrl,
    } = req.body;

    if (!projectName || !problemStatement || !description) {
      res.status(400).json({
        success: false,
        message: 'Project name, problem statement, and description are required.',
      });
      return;
    }

    // Auto-generate clean project code
    const count = await Project.countDocuments();
    const projectCode = `ROBO-PRJ-${String(count + 1).padStart(4, '0')}`;

    const project = await Project.create({
      projectCode,
      projectName: projectName.trim(),
      problemStatement: problemStatement.trim(),
      description: description.trim(),
      objectives: Array.isArray(objectives) ? objectives : [objectives].filter(Boolean),
      category: category || 'Robotics & Automation',
      status: 'PROPOSED',
      facultyMentor: facultyMentor || undefined,
      budget: Number(budget) || 0,
      repositoryUrl: repositoryUrl || '',
      createdBy: req.user!._id,
      teamMembers: [
        {
          user: req.user!._id,
          role: 'TEAM_LEAD',
          joinedAt: new Date(),
        },
      ],
    });

    await logAudit({
      actor: req.user!._id,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project._id.toString(),
      details: `Proposed project: ${project.projectName} (${project.projectCode})`,
      req,
    });

    // Notify faculty mentor if assigned
    if (facultyMentor) {
      await sendNotification({
        recipientId: facultyMentor,
        title: 'Project Mentorship Request',
        message: `${req.user!.fullName} listed you as faculty mentor for "${project.projectName}".`,
        type: 'SYSTEM_ALERT',
        link: `/projects/${project._id}`,
      });
    }

    const populated = await Project.findById(project._id)
      .populate('facultyMentor', 'fullName email')
      .populate('teamMembers.user', 'fullName collegeId');

    res.status(201).json({
      success: true,
      message: 'Project proposal submitted successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id (Update details/progress)
router.patch('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    // Authorization: User must be creator, team lead, or staff
    const isTeamLead = project.teamMembers.some(
      (m) => m.user.equals(req.user!._id) && m.role === 'TEAM_LEAD'
    );
    const isMentor = project.facultyMentor && project.facultyMentor.equals(req.user!._id);
    const isStaff = ['SUPER_ADMIN', 'LAB_ADMIN', 'FACULTY'].includes(req.user!.role);

    if (!isTeamLead && !project.createdBy.equals(req.user!._id) && !isMentor && !isStaff) {
      res.status(403).json({ success: false, message: 'Only team leads or mentors can edit project details.' });
      return;
    }

    const before = project.toObject();
    Object.assign(project, req.body);
    await project.save();

    await logAudit({
      actor: req.user!._id,
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project._id.toString(),
      details: `Project updated: ${project.projectName}`,
      before,
      after: project.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/:id/status (Approve/Reject or advance project stage - Faculty or Admin)
router.patch('/:id/status', authenticate, isFacultyOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status } = req.body as { status: ProjectStatus };
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const beforeStatus = project.status;
    project.status = status;
    await project.save();

    await logAudit({
      actor: req.user!._id,
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project._id.toString(),
      details: `Project status changed from ${beforeStatus} to ${status}`,
      req,
    });

    // Notify team
    for (const member of project.teamMembers) {
      await sendNotification({
        recipientId: member.user,
        title: `Project Status: ${status}`,
        message: `Your robotics project "${project.projectName}" status has been updated to ${status}.`,
        type: 'PROJECT_APPROVED',
        link: `/projects/${project._id}`,
      });
    }

    res.json({
      success: true,
      message: `Project status changed to ${status}.`,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/members (Add team member)
router.post('/:id/members', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userEmailOrId, role } = req.body as { userEmailOrId: string; role: TeamMemberRole };
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Only team lead or staff can add members
    const isLead = project.teamMembers.some((m) => m.user.equals(req.user!._id) && m.role === 'TEAM_LEAD');
    if (!isLead && !['SUPER_ADMIN', 'LAB_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Only team lead or lab admin can add members.' });
      return;
    }

    // Find target user
    const targetUser = await User.findOne({
      $or: [{ email: userEmailOrId.toLowerCase().trim() }, { collegeId: userEmailOrId.trim() }],
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found with provided email or Student ID.' });
      return;
    }

    const alreadyMember = project.teamMembers.some((m) => m.user.equals(targetUser._id));
    if (alreadyMember) {
      res.status(400).json({ success: false, message: 'User is already a member of this project team.' });
      return;
    }

    project.teamMembers.push({
      user: targetUser._id,
      role: role || 'HARDWARE',
      joinedAt: new Date(),
    });

    await project.save();

    await sendNotification({
      recipientId: targetUser._id,
      title: 'Joined Robotics Project Team',
      message: `You have been added to "${project.projectName}" as ${role || 'Hardware engineer'}.`,
      type: 'TEAM_INVITATION',
      link: `/projects/${project._id}`,
    });

    const populated = await Project.findById(project._id).populate(
      'teamMembers.user',
      'fullName email collegeId department avatarUrl'
    );

    res.json({
      success: true,
      message: `Added ${targetUser.fullName} to team.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const targetUserId = req.params.userId;
    // Allow self-removal (leaving team) or team lead removal
    const isSelf = req.user!._id.toString() === targetUserId;
    const isLead = project.teamMembers.some((m) => m.user.equals(req.user!._id) && m.role === 'TEAM_LEAD');

    if (!isSelf && !isLead && !['SUPER_ADMIN', 'LAB_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Not authorized to remove this team member.' });
      return;
    }

    project.teamMembers = project.teamMembers.filter((m) => m.user.toString() !== targetUserId);
    await project.save();

    res.json({
      success: true,
      message: isSelf ? 'You have left the project team.' : 'Member removed from project team.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/feedback (Faculty reviews project)
router.post('/:id/feedback', authenticate, isFacultyOrAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: 'Feedback text is required.' });
      return;
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    project.feedback = project.feedback || [];
    project.feedback.push({
      faculty: req.user!._id,
      text: text.trim(),
      date: new Date(),
    });
    await project.save();

    // Notify team
    for (const member of project.teamMembers) {
      await sendNotification({
        recipientId: member.user,
        title: 'New Faculty Feedback',
        message: `${req.user!.fullName} left feedback on your project "${project.projectName}".`,
        type: 'PROJECT_FEEDBACK',
        link: `/projects/${project._id}`,
      });
    }

    res.json({
      success: true,
      message: 'Feedback submitted to project team.',
      data: project.feedback,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/milestones (Add milestone)
router.post('/:id/milestones', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, dueDate, assignedMembers } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const milestone = await ProjectMilestone.create({
      project: project._id,
      title: title.trim(),
      description: description || '',
      dueDate: new Date(dueDate),
      assignedMembers: assignedMembers || [],
      status: 'PENDING',
      progress: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Milestone created.',
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/projects/milestones/:milestoneId
router.patch('/milestones/:milestoneId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const milestone = await ProjectMilestone.findById(req.params.milestoneId);
    if (!milestone) {
      res.status(404).json({ success: false, message: 'Milestone not found.' });
      return;
    }

    Object.assign(milestone, req.body);
    await milestone.save();

    res.json({
      success: true,
      message: 'Milestone updated.',
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
