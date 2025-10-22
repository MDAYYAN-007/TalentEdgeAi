'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth/auth-utils';
import {
    ArrowLeft, Calendar, MapPin, Building, User, Star,
    CheckCircle, XCircle, Clock, FileText, Zap, Video,
    Mail, AlertCircle, Briefcase, GraduationCap, DollarSign,
    Users, Target, BookOpen, Award, Clock4, Download,
    Send, Eye, EyeOff, Play, FileCheck, RefreshCw, X,Phone
} from 'lucide-react';
import { getRecruiterApplicationDetails } from '@/actions/applications/getRecruiterApplicationDetails';
import { updateApplicationStatus } from '@/actions/applications/updateApplicationStatus';
import { getJobDetails } from '@/actions/jobs/getJobDetails';
import { getApplicationStatusHistory } from '@/actions/applications/getApplicationStatusHistory';
import { getTestsForApplication } from '@/actions/tests/getTestsForApplication';
import { rescheduleTest } from '@/actions/tests/rescheduleTest';
import { rescheduleInterview } from '@/actions/interviews/rescheduleInterview';
import { getOrganizationTests } from '@/actions/tests/getOrganizationTests';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { assignMultipleTestsToApplicant } from '@/actions/tests/assignMultipleTestsToApplicant';
import { scheduleInterview } from '@/actions/interviews/scheduleInterview';
import { getAvailableInterviewers } from '@/actions/interviews/getAvailableInterviewers';
import { getInterviewsForApplication } from '@/actions/interviews/getInterviewsForApplication';
import { updateInterviewStatus } from '@/actions/interviews/updateInterviewStatus';
import { evaluateTestAttempt } from '@/actions/tests/evaluateTestAttempt';
import { evaluateWithAI } from '@/actions/tests/evaluateWithAI';
import { getTestAttemptId } from '@/actions/tests/getTestAttemptId';

export default function RecruiterApplicationDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.applicationId;

    const [application, setApplication] = useState(null);
    const [fullJob, setFullJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthorizedRecruiter, setIsAuthorizedRecruiter] = useState(false);
    const [isJobOwner, setIsJobOwner] = useState(false);
    const [isOrgMember, setIsOrgMember] = useState(true);
    const [hasViewAccess, setHasViewAccess] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('actions');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [testAssignments, setTestAssignments] = useState([]);
    const [isLoadingTests, setIsLoadingTests] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [notes, setNotes] = useState('');
    const [statusHistory, setStatusHistory] = useState([]);

    const [isAssignTestModalOpen, setIsAssignTestModalOpen] = useState(false);
    const [availableTests, setAvailableTests] = useState([]);
    const [selectedTests, setSelectedTests] = useState(new Set());
    const [testAssignmentSettings, setTestAssignmentSettings] = useState({
        testStartDate: '',
        testEndDate: '',
        isProctored: false,
        proctoringSettings: {
            fullscreen_required: true,
            tab_switching_detection: true,
            copy_paste_prevention: true
        }
    });
    const [isAssigningTest, setIsAssigningTest] = useState(false);

    // Interview related states
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
    const [availableInterviewers, setAvailableInterviewers] = useState([]);
    const [searchInterviewerQuery, setSearchInterviewerQuery] = useState('');
    const [interviews, setInterviews] = useState([]);
    const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
    const [interviewFormData, setInterviewFormData] = useState({
        scheduledAt: '',
        durationMinutes: 60,
        interviewType: 'technical',
        meetingPlatform: 'google_meet',
        meetingLink: '',
        meetingLocation: '',
        interviewers: [],
        notes: ''
    });

    const [isRescheduleTestModalOpen, setIsRescheduleTestModalOpen] = useState(false);
    const [isRescheduleInterviewModalOpen, setIsRescheduleInterviewModalOpen] = useState(false);
    const [selectedTestForReschedule, setSelectedTestForReschedule] = useState(null);
    const [selectedInterviewForReschedule, setSelectedInterviewForReschedule] = useState(null);
    const [testRescheduleSettings, setTestRescheduleSettings] = useState({
        testStartDate: '',
        testEndDate: '',
        isProctored: false,
        proctoringSettings: {
            fullscreen_required: true,
            tab_switching_detection: true,
            copy_paste_prevention: true
        }
    });
    const [interviewRescheduleData, setInterviewRescheduleData] = useState({
        scheduledAt: '',
        durationMinutes: 60,
        notes: ''
    });
    const [isRescheduling, setIsRescheduling] = useState(false);

    const [isCompleteInterviewModalOpen, setIsCompleteInterviewModalOpen] = useState(false);
    const [isCancelInterviewModalOpen, setIsCancelInterviewModalOpen] = useState(false);
    const [selectedInterviewForAction, setSelectedInterviewForAction] = useState(null);
    const [actionNotes, setActionNotes] = useState('');

    const interviewTypes = [
        { value: 'technical', label: 'Technical Interview' },
        { value: 'hr', label: 'HR Interview' },
        { value: 'managerial', label: 'Managerial Interview' },
        { value: 'cultural', label: 'Cultural Fit Interview' },
        { value: 'final', label: 'Final Round Interview' }
    ];

    const meetingPlatforms = [
        { value: 'google_meet', label: 'Google Meet' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'teams', label: 'Microsoft Teams' },
        { value: 'in_person', label: 'In-Person' },
        { value: 'phone', label: 'Phone Call' }
    ];

    useEffect(() => {
        const fetchUserAndCheckAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    // User is not authenticated - we'll handle this in the UI
                    setIsLoading(false);
                    return;
                }

                setUser(currentUser);

                // Check if user has the required role
                if (currentUser.role && !['HR', 'SeniorHR', 'OrgAdmin'].includes(currentUser.role)) {
                    router.push('/dashboard');
                    return;
                }

            } catch (error) {
                console.error('Error getting current user:', error);
                // User is not authenticated - we'll handle this in the UI
                setIsLoading(false);
            }
        };

        fetchUserAndCheckAuth();
    }, [router]);

    useEffect(() => {
        if (application) {
            fetchStatusHistory();
            fetchTestAssignments();
            fetchInterviews();
        }
    }, [application]);

    useEffect(() => {
        if (user) {
            fetchApplicationDetails();
        }
    }, [user, applicationId]);

    useEffect(() => {
        if (user?.orgId && isAssignTestModalOpen) {
            fetchAvailableTests();
        }
    }, [user, isAssignTestModalOpen]);

    // Fetch application details
    const fetchApplicationDetails = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const appResult = await getRecruiterApplicationDetails(authData, applicationId);

            if (appResult.success) {
                const applicationData = appResult.application;
                setApplication(applicationData);

                const jobResult = await getJobDetails(applicationData.job_id);

                if (jobResult.success) {
                    setFullJob(jobResult.job);
                    await checkRecruiterAccess(jobResult.job, user);
                } else {
                    toast.error(jobResult.message || 'Failed to load job details');
                }
            } else {
                toast.error(appResult.message || 'Failed to load application details');
            }
        } catch (error) {
            console.error('Error fetching application or job details:', error);
            toast.error('Error loading details');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch test assignments for this application
    // Fetch test assignments for this application
    const fetchTestAssignments = async () => {
        if (!applicationId) return;

        setIsLoadingTests(true);
        try {
            const result = await getTestsForApplication(applicationId);
            if (result.success) {
                // Fetch attempt details for each test assignment
                const assignmentsWithAttempts = await Promise.all(
                    (result.tests || []).map(async (assignment) => {
                        try {
                            const attemptResult = await getTestAttemptId(assignment.test_id, applicationId);
                            if (attemptResult.success) {
                                return {
                                    ...assignment,
                                    attempt_id: attemptResult.attempt.id,
                                    isEvaluated: attemptResult.attempt.is_evaluated,
                                    attempt_status: attemptResult.attempt.status,
                                    total_score: attemptResult.attempt.total_score,
                                    percentage: attemptResult.attempt.percentage,
                                    is_passed: attemptResult.attempt.is_passed
                                };
                            }
                            console.log('Assignment Result', assignment)
                            return assignment;
                        } catch (error) {
                            console.error('Error fetching attempt for test:', assignment.test_id, error);
                            return assignment;
                        }
                    })
                );

                setTestAssignments(assignmentsWithAttempts);
            } else {
                console.error('Failed to fetch test assignments:', result.message);
                setTestAssignments([]);
            }
        } catch (error) {
            console.error('Error fetching test assignments:', error);
            setTestAssignments([]);
        } finally {
            setIsLoadingTests(false);
        }
    };

    // Fetch application status history
    const fetchStatusHistory = async () => {
        if (!applicationId) return;

        try {
            const result = await getApplicationStatusHistory(applicationId);
            if (result.success) {
                setStatusHistory(result.history);
            } else {
                console.error('Failed to fetch status history:', result.message);
            }
        } catch (error) {
            console.error('Error fetching status history:', error);
        }
    };

    const fetchAvailableTests = async () => {
        try {
            const result = await getOrganizationTests(user.orgId);
            if (result.success) {
                setAvailableTests(result.tests || []);
            } else {
                toast.error(result.message || 'Failed to load available tests');
                setAvailableTests([]);
            }
        } catch (error) {
            console.error('Error fetching available tests:', error);
            toast.error('Error loading available tests');
            setAvailableTests([]);
        }
    };

    // Fetch interviews for this application
    const fetchInterviews = async () => {
        if (!applicationId) return;

        setIsLoadingInterviews(true);
        try {
            const result = await getInterviewsForApplication(applicationId);
            if (result.success) {
                setInterviews(result.interviews || []);
            } else {
                console.error('Failed to fetch interviews:', result.message);
                setInterviews([]);
            }
        } catch (error) {
            console.error('Error fetching interviews:', error);
            setInterviews([]);
        } finally {
            setIsLoadingInterviews(false);
        }
    };

    const handleRescheduleTest = (testAssignment) => {
        setSelectedTestForReschedule(testAssignment);
        setTestRescheduleSettings({
            testStartDate: testAssignment.test_start_date ? new Date(testAssignment.test_start_date).toISOString().slice(0, 16) : '',
            testEndDate: testAssignment.test_end_date ? new Date(testAssignment.test_end_date).toISOString().slice(0, 16) : '',
            isProctored: testAssignment.is_proctored || false,
            proctoringSettings: testAssignment.proctoring_settings || {
                fullscreen_required: true,
                tab_switching_detection: true,
                copy_paste_prevention: true
            }
        });
        setIsRescheduleTestModalOpen(true);
    };

    const handleConfirmTestReschedule = async () => {
        if (!selectedTestForReschedule || !testRescheduleSettings.testStartDate || !testRescheduleSettings.testEndDate) {
            toast.error('Please set both start and end dates');
            return;
        }

        setIsRescheduling(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await rescheduleTest(
                authData,
                selectedTestForReschedule.id,
                testRescheduleSettings.testStartDate,
                testRescheduleSettings.testEndDate,
                {
                    isProctored: testRescheduleSettings.isProctored,
                    proctoringSettings: testRescheduleSettings.proctoringSettings
                }
            );

            if (result.success) {
                toast.success(result.message);
                setIsRescheduleTestModalOpen(false);
                setSelectedTestForReschedule(null);
                // Refresh data
                await fetchTestAssignments();
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to reschedule test');
            }
        } catch (error) {
            console.error('Error rescheduling test:', error);
            toast.error('Error rescheduling test');
        } finally {
            setIsRescheduling(false);
        }
    };

    // Interview Reschedule Handlers
    const handleRescheduleInterview = (interview) => {
        setSelectedInterviewForReschedule(interview);
        setInterviewRescheduleData({
            scheduledAt: interview.scheduled_at ? new Date(interview.scheduled_at).toISOString().slice(0, 16) : '',
            durationMinutes: interview.duration_minutes || 60,
            notes: ''
        });
        setIsRescheduleInterviewModalOpen(true);
    };

    const handleConfirmInterviewReschedule = async () => {
        if (!selectedInterviewForReschedule || !interviewRescheduleData.scheduledAt) {
            toast.error('Please select interview date and time');
            return;
        }

        setIsRescheduling(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await rescheduleInterview(
                authData,
                selectedInterviewForReschedule.id,
                interviewRescheduleData.scheduledAt,
                interviewRescheduleData.durationMinutes,
                interviewRescheduleData.notes
            );

            if (result.success) {
                toast.success(result.message);
                setIsRescheduleInterviewModalOpen(false);
                setSelectedInterviewForReschedule(null);
                // Refresh data
                await fetchInterviews();
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to reschedule interview');
            }
        } catch (error) {
            console.error('Error rescheduling interview:', error);
            toast.error('Error rescheduling interview');
        } finally {
            setIsRescheduling(false);
        }
    };

    const handleInterviewRescheduleInputChange = (field, value) => {
        setInterviewRescheduleData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Check if user has access to this job's applications
    const checkRecruiterAccess = async (job, userData) => {
        const isRecruiter = job.assigned_recruiters?.includes(parseInt(userData.id));
        const isOwner = job.posted_by === userData.id;
        const isOrgMember = job.org_id === userData.orgId;
        const isOrgAdmin = userData.role === 'OrgAdmin';

        setIsAuthorizedRecruiter(isRecruiter);
        setIsJobOwner(isOwner);
        setIsOrgMember(isOrgMember);

        const hasFullAccess = isRecruiter || isOwner || isOrgAdmin;
        const hasViewAccess = isOrgMember;

        setHasViewAccess(hasViewAccess);

        if (!isOrgMember) {
            toast.error('You do not have access to this application');
            return;
        }

        if (!hasFullAccess) {
            toast.success('You have view-only access to this application');
        }
    };

    const openConfirmationModal = (action) => {
        setPendingAction(action);

        const defaultNotes = {
            shortlisted: `Candidate ${application.applicant_name} has been shortlisted for ${application.job_title} position. Strong match based on skills and experience.`,
            test_scheduled: `Technical assessment test assigned to ${application.applicant_name} for ${application.job_title} position.`,
            test_completed: `Test completed by ${application.applicant_name} for ${application.job_title} position.`,
            interview_scheduled: `Interview scheduled with ${application.applicant_name} for ${application.job_title} position.`,
            waiting_for_result: `Interview completed with ${application.applicant_name}. Waiting for final decision.`,
            hired: `Congratulations! ${application.applicant_name} has been hired for ${application.job_title} position.`,
            rejected: `Application from ${application.applicant_name} has been rejected for ${application.job_title} position.`
        };

        setNotes(defaultNotes[action.newStatus] || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingAction(null);
        setNotes('');
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateApplicationStatus(authData, applicationId, pendingAction.newStatus, notes);

            if (result.success) {
                setApplication(prev => ({ ...prev, status: pendingAction.newStatus }));
                toast.success(`Application ${pendingAction.newStatus.replace('_', ' ')}`);

                await fetchStatusHistory();
                closeModal();
            } else {
                toast.error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating application status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssignTest = () => {
        setIsAssignTestModalOpen(true);
        setSelectedTests(new Set());
        setTestAssignmentSettings({
            testStartDate: '',
            testEndDate: '',
            isProctored: false,
            proctoringSettings: {
                fullscreen_required: true,
                tab_switching_detection: true,
                copy_paste_prevention: true
            }
        });
    };

    const handleConfirmTestAssignment = async () => {
        if (selectedTests.size === 0 || !testAssignmentSettings.testStartDate || !testAssignmentSettings.testEndDate) {
            toast.error('Please select at least one test and set both start and end dates');
            return;
        }

        setIsAssigningTest(true);
        try {
            const result = await assignMultipleTestsToApplicant(
                Array.from(selectedTests),
                applicationId,
                testAssignmentSettings.testStartDate,
                testAssignmentSettings.testEndDate,
                user.id,
                user.orgId,
                {
                    isProctored: testAssignmentSettings.isProctored,
                    proctoringSettings: testAssignmentSettings.proctoringSettings
                }
            );

            if (result.success) {
                toast.success(result.message);
                setIsAssignTestModalOpen(false);
                setApplication(prev => ({ ...prev, status: 'test_scheduled' }));
                await fetchTestAssignments();
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to assign tests');
            }
        } catch (error) {
            console.error('Error assigning tests:', error);
            toast.error('Error assigning tests');
        } finally {
            setIsAssigningTest(false);
        }
    };

    const handleScheduleInterview = () => {
        setIsInterviewModalOpen(true);
        setInterviewFormData({
            scheduledAt: '',
            durationMinutes: 60,
            interviewType: 'technical',
            meetingPlatform: 'google_meet',
            meetingLink: '',
            meetingLocation: '',
            interviewers: [],
            notes: ''
        });
        setSearchInterviewerQuery('');
    };

    const handleInterviewInputChange = (field, value) => {
        setInterviewFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (field === 'meetingPlatform' && value !== 'in_person' && value !== 'phone') {
            const platformLinks = {
                'google_meet': 'https://meet.google.com/new',
                'zoom': 'https://zoom.us/j/',
                'teams': 'https://teams.microsoft.com/l/meetup-join/'
            };
            setInterviewFormData(prev => ({
                ...prev,
                meetingPlatform: value,
                meetingLink: platformLinks[value] || ''
            }));
        }

        if (field === 'meetingPlatform' && (value === 'in_person' || value === 'phone')) {
            setInterviewFormData(prev => ({
                ...prev,
                meetingLink: ''
            }));
        }
    };

    const handleInterviewerToggle = (interviewerId) => {
        setInterviewFormData(prev => ({
            ...prev,
            interviewers: prev.interviewers.includes(interviewerId)
                ? prev.interviewers.filter(id => id !== interviewerId)
                : [...prev.interviewers, interviewerId]
        }));
    };

    const handleInterviewSubmit = async (e) => {
        e.preventDefault();

        if (!interviewFormData.scheduledAt) {
            toast.error('Please select interview date and time');
            return;
        }

        if (interviewFormData.interviewers.length === 0) {
            toast.error('Please select at least one interviewer');
            return;
        }

        if (interviewFormData.meetingPlatform === 'in_person' && !interviewFormData.meetingLocation) {
            toast.error('Please provide meeting location for in-person interview');
            return;
        }

        setIsSchedulingInterview(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await scheduleInterview(authData, {
                applicationId: applicationId,
                ...interviewFormData
            });

            if (result.success) {
                toast.success('Interview scheduled successfully');
                setIsInterviewModalOpen(false);
                setApplication(prev => ({ ...prev, status: 'interview_scheduled' }));
                await fetchStatusHistory();
                await fetchInterviews(); // Add this line to refresh interviews list
            } else {
                toast.error(result.message || 'Failed to schedule interview');
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            toast.error('Error scheduling interview');
        } finally {
            setIsSchedulingInterview(false);
        }
    };

    const getSelectedInterviewers = () => {
        return availableInterviewers.filter(interviewer =>
            interviewFormData.interviewers.includes(interviewer.id)
        );
    };

    const handleUpdateInterviewStatus = async (interviewId, newStatus, notes = '') => {
        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateInterviewStatus(authData, interviewId, newStatus, notes);

            if (result.success) {
                toast.success(`Interview marked as ${newStatus}`);
                // Refresh interviews list
                await fetchInterviews();
                // Refresh status history
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to update interview status');
            }
        } catch (error) {
            console.error('Error updating interview status:', error);
            toast.error('Error updating interview status');
        } finally {
            setIsUpdating(false);
        }
    };

    const getInterviewStatusColor = (status, scheduledAt) => {
        const now = new Date();
        const interviewTime = new Date(scheduledAt);

        // If interview time has passed and status is still scheduled, show warning
        if (status === 'scheduled' && now > interviewTime) {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }

        const colors = {
            scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
            rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getInterviewStatusIcon = (status, scheduledAt) => {
        const now = new Date();
        const interviewTime = new Date(scheduledAt);

        // If interview time has passed and status is still scheduled, show warning icon
        if (status === 'scheduled' && now > interviewTime) {
            return <AlertCircle className="w-4 h-4 text-amber-600" />;
        }

        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'rescheduled':
                return <RefreshCw className="w-4 h-4 text-purple-600" />;
            case 'scheduled':
                return <Calendar className="w-4 h-4 text-blue-600" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-600" />;
        }
    };

    const isInterviewCompleted = (interview) => {
        const now = new Date();
        const interviewTime = new Date(interview.scheduled_at);
        return now > interviewTime && interview.status === 'scheduled';
    };

    // Add these handler functions
    const handleCompleteInterview = (interview) => {
        setSelectedInterviewForAction(interview);
        setActionNotes('');
        setIsCompleteInterviewModalOpen(true);
    };

    const handleCancelInterview = (interview) => {
        setSelectedInterviewForAction(interview);
        setActionNotes('');
        setIsCancelInterviewModalOpen(true);
    };

    const confirmCompleteInterview = async () => {
        if (!selectedInterviewForAction) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateInterviewStatus(
                authData,
                selectedInterviewForAction.id,
                'completed',
                actionNotes || `Interview marked as completed by ${user.name}`
            );

            if (result.success) {
                toast.success('Interview marked as completed');
                await fetchInterviews();
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to update interview status');
            }
        } catch (error) {
            console.error('Error updating interview status:', error);
            toast.error('Error updating interview status');
        } finally {
            setIsUpdating(false);
            setIsCompleteInterviewModalOpen(false);
            setSelectedInterviewForAction(null);
            setActionNotes('');
        }
    };

    const confirmCancelInterview = async () => {
        if (!selectedInterviewForAction) return;

        setIsUpdating(true);
        try {
            const authData = {
                orgId: user.orgId,
                userId: user.id
            };

            const result = await updateInterviewStatus(
                authData,
                selectedInterviewForAction.id,
                'cancelled',
                actionNotes || `Interview cancelled by ${user.name}`
            );

            if (result.success) {
                toast.success('Interview cancelled');
                await fetchInterviews();
                await fetchStatusHistory();
            } else {
                toast.error(result.message || 'Failed to cancel interview');
            }
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error('Error cancelling interview');
        } finally {
            setIsUpdating(false);
            setIsCancelInterviewModalOpen(false);
            setSelectedInterviewForAction(null);
            setActionNotes('');
        }
    };

    useEffect(() => {
        if (isInterviewModalOpen) {
            const fetchInterviewersData = async () => {
                try {
                    const response = await getAvailableInterviewers(user.orgId);
                    if (response.success) {
                        setAvailableInterviewers(response.interviewers);
                    } else {
                        toast.error(response.message || 'Failed to load interviewers');
                    }
                } catch (error) {
                    console.error('Error fetching interviewers:', error);
                    toast.error('Error loading interviewers');
                }
            };

            fetchInterviewersData();
        }
    }, [isInterviewModalOpen, user?.orgId]);

    const filteredInterviewers = availableInterviewers.filter(interviewer =>
        interviewer.name.toLowerCase().includes(searchInterviewerQuery.toLowerCase()) ||
        interviewer.email.toLowerCase().includes(searchInterviewerQuery.toLowerCase())
    );

    const isTestAlreadyAssigned = (testId) => {
        return testAssignments.some(assignment =>
            assignment.test_id === testId &&
            ['assigned', 'attempted'].includes(assignment.status)
        );
    };

    const handleViewTestDetails = (testAssignment) => {
        console.log('Viewing test details:', testAssignment);
        toast.success('Test details view functionality will be implemented soon');
    };

    const handleSendReminder = (testAssignment) => {
        console.log('Sending reminder for test:', testAssignment);
        toast.success('Reminder sent to candidate');
    };

    const handleDownloadReport = (testAssignment) => {
        console.log('Downloading test report:', testAssignment);
        toast.success('Test report download functionality will be implemented soon');
    };

    const handleViewTestResults = (testAssignment) => {
        console.log('Viewing test results:', testAssignment);
        toast.success('Test results view functionality will be implemented soon');
    };

    const handleDownloadResume = () => {
        toast.success('Download functionality will be implemented soon');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'hired':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'interview_scheduled':
                return <Video className="w-5 h-5 text-purple-500" />;
            case 'test_scheduled':
                return <Zap className="w-5 h-5 text-blue-500" />;
            case 'test_completed':
                return <FileCheck className="w-5 h-5 text-green-500" />;
            case 'shortlisted':
                return <Star className="w-5 h-5 text-indigo-500" />;
            case 'waiting_for_result':
                return <Clock className="w-5 h-5 text-orange-500" />;
            case 'submitted':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            shortlisted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            test_scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
            test_completed: 'bg-green-100 text-green-800 border-green-200',
            interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
            waiting_for_result: 'bg-orange-100 text-orange-800 border-orange-200',
            hired: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getTestStatusColor = (status) => {
        const colors = {
            assigned: 'bg-blue-100 text-blue-800 border-blue-200',
            attempted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            ready_for_evaluation: 'bg-orange-100 text-orange-800 border-orange-200',
            evaluated: 'bg-green-100 text-green-800 border-green-200',
            expired: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatSalary = (min, max, currency = 'INR') => {
        if (!min && !max) return 'Not specified';

        const formatNumber = (num) => {
            if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
            if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
            return num.toString();
        };

        if (min && max) return `${formatNumber(min)} - ${formatNumber(max)} ${currency}`;
        if (min) return `From ${formatNumber(min)} ${currency}`;
        return `Up to ${formatNumber(max)} ${currency}`;
    };

    const getAvailableActions = () => {
        const currentStatus = application.status;

        if (!isAuthorizedRecruiter && !isJobOwner && user?.role !== 'OrgAdmin') {
            return [];
        }

        switch (currentStatus) {
            case 'submitted':
                return [
                    {
                        id: 'shortlist',
                        label: 'Shortlist Candidate',
                        description: 'Move candidate to shortlisted pool for further evaluation',
                        icon: Star,
                        color: 'bg-indigo-600 hover:bg-indigo-700',
                        action: () => openConfirmationModal({ newStatus: 'shortlisted' })
                    },
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test to evaluate candidate skills',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'shortlisted':
                return [
                    {
                        id: 'assign_test',
                        label: 'Assign Test',
                        description: 'Send assessment test to evaluate candidate skills',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'test_scheduled':
                return [
                    {
                        id: 'assign_another_test',
                        label: 'Assign Another Test',
                        description: 'Send additional assessment test to candidate',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'test_completed':
                return [
                    {
                        id: 'assign_another_test',
                        label: 'Assign Another Test',
                        description: 'Send additional assessment test to candidate',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'schedule_interview',
                        label: 'Schedule Interview',
                        description: 'Arrange interview with the candidate',
                        icon: Video,
                        color: 'bg-purple-600 hover:bg-purple-700',
                        action: handleScheduleInterview
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate at this stage',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'interview_scheduled':
                return [
                    {
                        id: 'assign_another_test',
                        label: 'Assign Another Test',
                        description: 'Send additional assessment test to candidate',
                        icon: Zap,
                        color: 'bg-blue-600 hover:bg-blue-700',
                        action: handleAssignTest
                    },
                    {
                        id: 'direct_hire',
                        label: 'Direct Hire',
                        description: 'Hire candidate directly without further process',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Reject candidate after interview',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            case 'waiting_for_result':
                return [
                    {
                        id: 'hire',
                        label: 'Hire Candidate',
                        description: 'Final decision - Hire the candidate',
                        icon: CheckCircle,
                        color: 'bg-green-600 hover:bg-green-700',
                        action: () => openConfirmationModal({ newStatus: 'hired' })
                    },
                    {
                        id: 'reject',
                        label: 'Reject Application',
                        description: 'Final decision - Reject the candidate',
                        icon: XCircle,
                        color: 'bg-red-600 hover:bg-red-700',
                        action: () => openConfirmationModal({ newStatus: 'rejected' })
                    }
                ];

            default:
                return [];
        }
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading application details...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Add this check for unauthenticated users
    if (!user) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                        <p className="text-gray-600 mb-6">You need to be signed in to view application details.</p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/signin"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!isOrgMember) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                        <p className="text-gray-600 mb-6">You don't have access to this application.</p>
                        <Link
                            href="/organization/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Applications
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!application) {
        return (
            <>
                <Navbar />
                <Toaster />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
                        <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have access to it.</p>
                        <Link
                            href="/organization/applications"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Applications
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const availableActions = getAvailableActions();

    const tabs = [
        { id: 'actions', label: 'Actions', icon: Send },
        { id: 'resume', label: 'Resume Details', icon: User },
        { id: 'job', label: 'Job Details', icon: Building },
        ...(application.ai_feedback ? [{ id: 'ai-analysis', label: 'AI Analysis', icon: Zap }] : [])
    ];

    const TestAssignmentsSection = () => {
        const [isEvaluating, setIsEvaluating] = useState(false);
        const [evaluationResult, setEvaluationResult] = useState(null);
        const [showEvaluationModal, setShowEvaluationModal] = useState(false);

        // Function to get evaluation status
        const getEvaluationStatus = (test) => {
            if (test.isEvaluated) return 'evaluated';
            if (test.attempt_id && test.attempt_status === 'submitted') return 'ready_for_evaluation';
            if (test.status === 'attempted') return 'attempted';
            return test.status;
        };

        // Function to handle test evaluation
        const handleEvaluateTest = async (testAssignment) => {
            console.log('Evaluating test assignment:', testAssignment);

            let attemptId = testAssignment.attempt_id;

            // If attempt_id is not available, fetch it first
            if (!attemptId) {
                try {
                    const attemptResult = await getTestAttemptId(testAssignment.test_id, applicationId);
                    if (!attemptResult.success) {
                        toast.error('No test attempt found for evaluation');
                        return;
                    }
                    attemptId = attemptResult.attempt.id;
                } catch (error) {
                    console.error('Error fetching attempt ID:', error);
                    toast.error('Failed to find test attempt');
                    return;
                }
            }

            setIsEvaluating(true);
            try {
                const result = await evaluateTestAttempt(attemptId);

                if (result.success) {
                    setEvaluationResult({
                        ...result.data,
                        attemptId: attemptId
                    });
                    setShowEvaluationModal(true);
                    await fetchTestAssignments();
                    console.log('Test evaluated successfully:', result.data);
                } else {
                    toast.error(result.message || 'Failed to evaluate test');
                }
            } catch (error) {
                console.error('Error evaluating test:', error);
                toast.error('Error evaluating test');
            } finally {
                setIsEvaluating(false);
            }
        };

        if (isLoadingTests) {
            return (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Test Assignments</h3>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading test assignments...</p>
                    </div>
                </div>
            );
        }

        if (testAssignments.length === 0) {
            return null;
        }

        return (
            <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Test Assignments</h3>
                <div className="space-y-6">
                    {testAssignments.map((test) => {
                        const evaluationStatus = getEvaluationStatus(test);
                        console.log('Rendering test assignment:', test, 'with evaluation status:', evaluationStatus);

                        return (
                            <div key={test.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        {/* Test Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900">{test.test_title}</h4>
                                                    <p className="text-gray-600 text-sm">
                                                        Assigned by: <span className="font-semibold">{test.assigned_by_name}</span>
                                                        {test.assigned_by_email && ` (${test.assigned_by_email})`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getTestStatusColor(evaluationStatus)}`}>
                                                {evaluationStatus === 'assigned' && <Clock className="w-4 h-4" />}
                                                {evaluationStatus === 'attempted' && <Play className="w-4 h-4" />}
                                                {evaluationStatus === 'ready_for_evaluation' && <FileCheck className="w-4 h-4" />}
                                                {evaluationStatus === 'evaluated' && <CheckCircle className="w-4 h-4" />}
                                                {evaluationStatus === 'expired' && <XCircle className="w-4 h-4" />}
                                                {evaluationStatus === 'cancelled' && <XCircle className="w-4 h-4" />}
                                                {evaluationStatus.replace(/_/g, ' ')}
                                            </div>
                                        </div>

                                        {/* Test Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Duration</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {test.duration_minutes} mins
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Total Marks</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {test.total_marks}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Passing Marks</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {test.passing_percentage}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Evaluation Status</div>
                                                <div className={`text-lg font-semibold ${test.isEvaluated ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {test.isEvaluated ? 'Evaluated' : 'Pending'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Alert for Ready Evaluation */}
                                        {evaluationStatus === 'ready_for_evaluation' && !test.isEvaluated && (
                                            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                                                Test completed - Ready for evaluation
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side Section - Score Display and Actions */}
                                    <div className="flex flex-col gap-4 lg:w-80">
                                        {/* Score Display Section */}
                                        {test.isEvaluated && test.percentage !== null ? (
                                            <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(test.percentage)}`}>
                                                    <Star className="w-4 h-4" />
                                                    <span className="font-semibold">Score: {test.percentage}%</span>
                                                </div>
                                                {test.passing_percentage && (
                                                    <div className={`text-sm font-medium text-center ${test.is_passed ? 'text-green-600' : 'text-red-600'}`}>
                                                        {test.is_passed ? 'Passed' : 'Failed'}
                                                        (Required: {test.passing_percentage}%)
                                                    </div>
                                                )}
                                                {test.attempt_id && (
                                                    <Link
                                                        href={`/organization/applications/${applicationId}/result/${test.attempt_id}`}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Detailed Results
                                                    </Link>
                                                )}
                                            </div>
                                        ) : null}

                                        {/* Action Buttons */}
                                        {(isAuthorizedRecruiter || isJobOwner || (user && user.role === 'OrgAdmin')) && (
                                            <div className="flex flex-col gap-3">
                                                {evaluationStatus === 'ready_for_evaluation' && (
                                                    <button
                                                        onClick={() => handleEvaluateTest(test)}
                                                        disabled={isEvaluating}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                                                    >
                                                        {isEvaluating ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <FileCheck className="w-4 h-4" />
                                                        )}
                                                        {isEvaluating ? 'Evaluating...' : 'Evaluate Test'}
                                                    </button>
                                                )}

                                                {/* Additional test actions can be added here */}
                                                {evaluationStatus === 'assigned' && (
                                                    <button
                                                        onClick={() => handleRescheduleTest(test)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        Reschedule Test
                                                    </button>
                                                )}

                                                {(evaluationStatus === 'assigned' || evaluationStatus === 'ready_for_evaluation') && (
                                                    <button
                                                        onClick={() => handleCancelTest(test)}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Cancel Test
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Evaluation Result Modal */}
                {showEvaluationModal && evaluationResult && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Test Evaluation Complete</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-gray-600">Total Score</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {evaluationResult.totalScore}/{evaluationResult.totalPossibleMarks}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-gray-600">Percentage</div>
                                        <div className={`text-lg font-semibold ${getScoreColor(evaluationResult.percentage)}`}>
                                            {evaluationResult.percentage}%
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-gray-600">Result</div>
                                        <div className={`text-lg font-semibold ${evaluationResult.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                            {evaluationResult.isPassed ? 'PASSED' : 'FAILED'}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-gray-600">Passing Marks</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {evaluationResult.passingMarks}%
                                        </div>
                                    </div>
                                </div>

                                {evaluationResult.needsAIEvaluation > 0 && (
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm">
                                                {evaluationResult.needsAIEvaluation} question(s) need AI evaluation
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowEvaluationModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                >
                                    Close
                                </button>
                                {evaluationResult.attemptId && (
                                    <Link
                                        href={`/organization/test-results/${evaluationResult.attemptId}`}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200"
                                    >
                                        View Detailed Results
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const InterviewsSection = () => {
        if (isLoadingInterviews) {
            return (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Interview Schedule</h3>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading interviews...</p>
                    </div>
                </div>
            );
        }

        if (interviews.length === 0) {
            return null;
        }

        return (
            <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Interview Schedule</h3>
                <div className="space-y-6">
                    {interviews.map((interview) => {
                        const isCompleted = isInterviewCompleted(interview);

                        return (
                            <div key={interview.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        {/* Interview Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Video className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900">
                                                        {interviewTypes.find(t => t.value === interview.interview_type)?.label || 'Interview'}
                                                    </h4>
                                                    <p className="text-gray-600 text-sm">
                                                        Scheduled by: <span className="font-semibold">{interview.scheduled_by_name}</span>
                                                        {interview.scheduled_by_email && ` (${interview.scheduled_by_email})`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getInterviewStatusColor(interview.status, interview.scheduled_at)}`}>
                                                {getInterviewStatusIcon(interview.status, interview.scheduled_at)}
                                                {interview.status === 'scheduled' && isCompleted ? 'Time Completed' : interview.status.replace('_', ' ')}
                                            </div>
                                        </div>

                                        {/* Interview Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Date & Time</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {formatDateTime(interview.scheduled_at)}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Duration</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {interview.duration_minutes} mins
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Platform</div>
                                                <div className="text-lg font-semibold text-gray-900 capitalize">
                                                    {interview.meeting_platform?.replace('_', ' ') || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                <div className="text-sm text-gray-600 font-medium">Interviewers</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {interview.interviewer_names?.length || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meeting Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                            <div className="space-y-2">
                                                {interview.meeting_platform === 'in_person' ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>Location: {interview.meeting_location || 'Not specified'}</span>
                                                    </div>
                                                ) : interview.meeting_platform !== 'phone' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Video className="w-4 h-4" />
                                                        <span>Link: {interview.meeting_link ? (
                                                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                Join Meeting
                                                            </a>
                                                        ) : 'Not provided'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4" />
                                                        <span>Phone Interview</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                        <span>Interviewers: {interview.interviewer_names.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {interview.notes && (
                                            <div className="mb-4">
                                                <div className="text-sm font-semibold text-gray-700 mb-2">Notes</div>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    {interview.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Status Alert for Completed Time */}
                                        {isCompleted && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-amber-800">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="font-medium">Interview time has completed</span>
                                                    <span className="text-sm">- Please mark as completed or reschedule</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {(isAuthorizedRecruiter || isJobOwner || (user && user.role === 'OrgAdmin')) && (
                                        <div className="flex flex-col gap-3 lg:w-48">

                                            {interview.status === 'scheduled' && (
                                                <>
                                                    {isCompleted ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleCompleteInterview(interview)}
                                                                disabled={isUpdating}
                                                                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Mark as Completed
                                                            </button>
                                                            <button
                                                                onClick={() => handleRescheduleInterview(interview)}
                                                                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Reschedule Interview
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleCompleteInterview(interview)}
                                                                disabled={isUpdating}
                                                                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Mark Completed
                                                            </button>
                                                            <button
                                                                onClick={() => handleRescheduleInterview(interview)}
                                                                className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Reschedule
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancelInterview(interview)}
                                                        disabled={isUpdating}
                                                        className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Cancel Interview
                                                    </button>
                                                </>
                                            )}
                                            {interview.status === 'completed' && (
                                                <button
                                                    onClick={() => handleRescheduleInterview(interview)}
                                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Schedule New Interview
                                                </button>
                                            )}
                                            {interview.status === 'cancelled' && (
                                                <button
                                                    onClick={() => handleRescheduleInterview(interview)}
                                                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Reschedule Interview
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <Toaster position="top-right" />

            <InterviewModal
                isOpen={isInterviewModalOpen}
                onClose={() => setIsInterviewModalOpen(false)}
                application={application}
                interviewFormData={interviewFormData}
                onInterviewFormDataChange={handleInterviewInputChange}
                availableInterviewers={filteredInterviewers}
                searchInterviewerQuery={searchInterviewerQuery}
                onSearchInterviewerQueryChange={setSearchInterviewerQuery}
                onInterviewerToggle={handleInterviewerToggle}
                onInterviewSubmit={handleInterviewSubmit}
                isScheduling={isSchedulingInterview}
                interviewTypes={interviewTypes}
                meetingPlatforms={meetingPlatforms}
                getSelectedInterviewers={getSelectedInterviewers}
                formatDateTime={formatDateTime}
            />

            <AssignTestModal
                isOpen={isAssignTestModalOpen}
                onClose={() => setIsAssignTestModalOpen(false)}
                application={application}
                availableTests={availableTests}
                selectedTests={selectedTests}
                onSelectedTestsChange={setSelectedTests}
                testAssignmentSettings={testAssignmentSettings}
                onTestAssignmentSettingsChange={setTestAssignmentSettings}
                onConfirmAssignment={handleConfirmTestAssignment}
                isAssigning={isAssigningTest}
                isTestAlreadyAssigned={isTestAlreadyAssigned}
                formatDateTime={formatDateTime}
            />

            <RescheduleTestModal
                isOpen={isRescheduleTestModalOpen}
                onClose={() => {
                    setIsRescheduleTestModalOpen(false);
                    setSelectedTestForReschedule(null);
                }}
                testAssignment={selectedTestForReschedule}
                rescheduleSettings={testRescheduleSettings}
                onRescheduleSettingsChange={setTestRescheduleSettings}
                onConfirmReschedule={handleConfirmTestReschedule}
                isRescheduling={isRescheduling}
                formatDateTime={formatDateTime}
            />

            {/* Reschedule Interview Modal */}
            <RescheduleInterviewModal
                isOpen={isRescheduleInterviewModalOpen}
                onClose={() => {
                    setIsRescheduleInterviewModalOpen(false);
                    setSelectedInterviewForReschedule(null);
                }}
                interview={selectedInterviewForReschedule}
                rescheduleData={interviewRescheduleData}
                onRescheduleDataChange={handleInterviewRescheduleInputChange}
                onConfirmReschedule={handleConfirmInterviewReschedule}
                isRescheduling={isRescheduling}
                formatDateTime={formatDateTime}
                interviewTypes={interviewTypes}
            />

            <CompleteInterviewModal
                isOpen={isCompleteInterviewModalOpen}
                onClose={() => {
                    setIsCompleteInterviewModalOpen(false);
                    setSelectedInterviewForAction(null);
                    setActionNotes('');
                }}
                interview={selectedInterviewForAction}
                onConfirm={confirmCompleteInterview}
                isUpdating={isUpdating}
                notes={actionNotes}
                onNotesChange={setActionNotes}
                interviewTypes={interviewTypes}
                formatDateTime={formatDateTime}
            />

            <CancelInterviewModal
                isOpen={isCancelInterviewModalOpen}
                onClose={() => {
                    setIsCancelInterviewModalOpen(false);
                    setSelectedInterviewForAction(null);
                    setActionNotes('');
                }}
                interview={selectedInterviewForAction}
                onConfirm={confirmCancelInterview}
                isUpdating={isUpdating}
                notes={actionNotes}
                onNotesChange={setActionNotes}
                interviewTypes={interviewTypes}
                formatDateTime={formatDateTime}
            />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                    <div className="max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-8 py-6 ">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.push('/organization/applications')}
                                className="cursor-pointer inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium group"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                Back to Applications
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg shadow-sm">
                                        <Building className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg bg-white px-3 py-1 rounded-full border">
                                        {application.job_title}
                                    </span>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                    {application.applicant_name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">{application.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Applied {formatDate(application.applied_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm font-medium">{application.applicant_email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(application.status)} shadow-sm`}>
                                    {getStatusIcon(application.status)}
                                    <span className="font-semibold capitalize text-sm">{application.status.replace('_', ' ')}</span>
                                </div>
                                {application.resume_score > 0 && (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getScoreColor(application.resume_score)} shadow-sm`}>
                                        <Star className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{application.resume_score}% Match Score</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions - Only Download Button */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleDownloadResume}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Download className="w-4 h-4" />
                                Download Application
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 2xl:px-20">
                    {/* Mobile Tab Selector */}
                    <div className="md:hidden mb-6">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-lg"
                        >
                            <span className="font-semibold text-gray-700">
                                {tabs.find(tab => tab.id === activeTab)?.label}
                            </span>
                            {isMobileMenuOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>

                        {isMobileMenuOpen && (
                            <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Navigation Tabs */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 p-2 mb-8 shadow-lg">
                        <div className="flex gap-2">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`cursor-pointer flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        {activeTab === 'actions' && (
                            <div className="p-6 lg:p-8">
                                <div className="mb-8">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Application Actions</h2>
                                    <p className="text-gray-600 text-lg">
                                        Current Status: <span className={`font-semibold ${getStatusColor(application.status)} px-3 py-1 rounded-full`}>
                                            {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </p>
                                    {/* View-only indicator */}
                                    {!isAuthorizedRecruiter && !isJobOwner && user?.role !== 'OrgAdmin' && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-amber-800">
                                                <Eye className="w-4 h-4" />
                                                <span className="font-semibold">View Only Mode</span>
                                                <span className="text-sm">- You can view this application but cannot perform actions</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {availableActions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableActions.map((action) => {
                                            const IconComponent = action.icon;
                                            return (
                                                <div key={action.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col h-full">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <IconComponent className="w-6 h-6 text-gray-700" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-gray-900">{action.label}</h3>
                                                        </div>

                                                        <p className="text-gray-600 mb-6 flex-grow">
                                                            {action.description}
                                                        </p>

                                                        <button
                                                            onClick={action.action}
                                                            disabled={isUpdating}
                                                            className={`cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                                                        >
                                                            {isUpdating ? (
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                            ) : (
                                                                <>
                                                                    <IconComponent className="w-4 h-4" />
                                                                    {action.label}
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (isAuthorizedRecruiter || isJobOwner || user.role == 'OrgAdmin' &&
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Actions Available</h3>
                                        <p className="text-gray-600">
                                            All actions have been completed for this application.
                                        </p>
                                    </div>
                                )}

                                {/* Test Assignments Section */}
                                <TestAssignmentsSection />

                                <InterviewsSection />

                                {/* Status History Timeline */}
                                <div className="mt-12">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Status History</h3>
                                    {statusHistory.length > 0 ? (
                                        <div className="space-y-4">
                                            {statusHistory.map((historyItem, index) => (
                                                <div key={historyItem.id} className="flex gap-4">
                                                    {/* Timeline line */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                                        {index < statusHistory.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                                                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(historyItem.newStatus)}`}>
                                                                    {getStatusIcon(historyItem.newStatus)}
                                                                    {historyItem.newStatus.replace('_', ' ')}
                                                                </div>
                                                                {historyItem.oldStatus && (
                                                                    <>
                                                                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(historyItem.oldStatus)}`}>
                                                                            {getStatusIcon(historyItem.oldStatus)}
                                                                            {historyItem.oldStatus.replace('_', ' ')}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                                                                {formatDate(historyItem.performedAt)}
                                                            </div>
                                                        </div>

                                                        <div className="text-sm text-gray-600 mb-2">
                                                            Updated by: <span className="font-semibold text-gray-800">
                                                                {historyItem.performerName || 'System'}
                                                            </span>
                                                            {historyItem.performerEmail && (
                                                                <span className="text-gray-500"> ({historyItem.performerEmail})</span>
                                                            )}
                                                        </div>

                                                        {historyItem.notes && (
                                                            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                                                <p className="text-sm text-gray-700 leading-relaxed">{historyItem.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                                            <Clock4 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Status History</h4>
                                            <p className="text-gray-600">Status changes will appear here once they occur.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Other tabs (resume, job, ai-analysis) remain the same */}
                        {activeTab === 'resume' && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Personal Information */}
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Personal Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                            <p className="text-gray-900 text-lg font-semibold">{application.application_data?.basic?.name}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                            <p className="text-gray-900 text-lg">{application.application_data?.basic?.email}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-sm">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                            <p className="text-gray-900 text-lg">{application.application_data?.basic?.phone}</p>
                                        </div>
                                        {application.application_data?.basic?.linkedinUrl && (
                                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                                                <a href={application.application_data.basic.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-lg hover:text-blue-700 font-medium">
                                                    View Profile
                                                </a>
                                            </div>
                                        )}
                                        {application.application_data?.basic?.portfolioUrl && (
                                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200 shadow-sm">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio</label>
                                                <a href={application.application_data.basic.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-lg hover:text-orange-700 font-medium">
                                                    Visit Portfolio
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                {application.application_data?.skills && application.application_data.skills.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Skills</h2>
                                        <div className="flex flex-wrap gap-3">
                                            {application.application_data.skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Work Experience */}
                                {application.application_data?.experiences && application.application_data.experiences.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg">
                                                <Briefcase className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            Work Experience
                                        </h2>
                                        <div className="space-y-6">
                                            {application.application_data.experiences.map((exp, index) => (
                                                <div key={index} className="border-l-4 border-indigo-500 pl-6 py-5 bg-gradient-to-r from-indigo-50 to-white rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                                                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{exp.jobTitle}</h3>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {exp.duration}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg lg:text-xl text-gray-700 font-semibold mb-4">{exp.company}</p>
                                                    {exp.description && (
                                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line bg-white p-5 rounded-xl border text-lg">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {application.application_data?.education && application.application_data.education.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200 flex items-center gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <GraduationCap className="w-6 h-6 text-green-600" />
                                            </div>
                                            Education
                                        </h2>
                                        <div className="space-y-4">
                                            {application.application_data.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-green-500 pl-6 py-5 bg-gradient-to-r from-green-50 to-white rounded-r-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                                                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{edu.degree}</h3>
                                                        <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full font-semibold border shadow-sm mt-2 sm:mt-0">
                                                            {edu.year}
                                                        </span>
                                                    </div>
                                                    <p className="text-lg lg:text-xl text-gray-700 font-semibold mb-3">{edu.institution}</p>
                                                    {edu.grade && (
                                                        <p className="text-gray-600 font-semibold text-lg">Grade: {edu.grade}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cover Letter */}
                                {application.cover_letter && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Cover Letter</h2>
                                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg lg:text-xl">
                                                {application.cover_letter}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'job' && fullJob && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Job Header */}
                                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 lg:p-8 border border-blue-200 shadow-lg">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        <div className="flex-1">
                                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{fullJob.title}</h1>
                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-base lg:text-lg text-gray-700">
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <Building className="w-5 h-5 text-blue-600" />
                                                    <span className="font-semibold">{fullJob.company_name || application.department}</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <MapPin className="w-5 h-5 text-green-600" />
                                                    <span>{fullJob.location}</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border shadow-sm">
                                                    <Users className="w-5 h-5 text-purple-600" />
                                                    <span className="capitalize">{fullJob.experience_level} Level</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl lg:w-80 w-full flex-shrink-0">
                                            <div className="text-center">
                                                <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-3">
                                                    {formatSalary(fullJob.min_salary, fullJob.max_salary, fullJob.currency)}
                                                </div>
                                                <div className="text-gray-600 font-medium">Annual Salary Range</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Job Description */}
                                        {fullJob.job_description && (
                                            <div>
                                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    Job Overview
                                                </h2>
                                                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                                                    <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                                                        {fullJob.job_description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Key Responsibilities */}
                                        {fullJob.responsibilities && fullJob.responsibilities.length > 0 && (
                                            <div>
                                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <Target className="w-6 h-6 text-red-600" />
                                                    </div>
                                                    Key Responsibilities
                                                </h2>
                                                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                    <ul className="space-y-4">
                                                        {fullJob.responsibilities.map((responsibility, index) => (
                                                            <li key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                                                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                                                                <p className="text-gray-700 text-lg leading-relaxed flex-1">{responsibility}</p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Required Skills */}
                                        {fullJob.required_skills && fullJob.required_skills.length > 0 && (
                                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                    <Zap className="w-5 h-5 text-yellow-600" />
                                                    Required Skills
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {fullJob.required_skills.map((skill, index) => (
                                                        <span key={index} className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border border-yellow-200">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Qualifications */}
                                        {fullJob.qualifications && fullJob.qualifications.length > 0 && (
                                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                    <Award className="w-5 h-5 text-indigo-600" />
                                                    Qualifications
                                                </h3>
                                                <div className="space-y-3">
                                                    {fullJob.qualifications.map((qualification, index) => (
                                                        <div key={index} className="flex items-start gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <p className="text-base flex-1">{qualification}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Employment Details */}
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Employment Details</h3>
                                            <div className="space-y-3">
                                                {fullJob.job_type && (
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-gray-600 font-medium">Job Type</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-blue-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.job_type}
                                                        </span>
                                                    </div>
                                                )}
                                                {fullJob.work_mode && (
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-gray-600 font-medium">Work Mode</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-green-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.work_mode}
                                                        </span>
                                                    </div>
                                                )}
                                                {fullJob.experience_level && (
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-gray-600 font-medium">Experience Level</span>
                                                        <span className="text-gray-900 font-semibold capitalize bg-purple-100 px-3 py-1 rounded-full text-sm">
                                                            {fullJob.experience_level}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Job Dates */}
                                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-gray-600" />
                                                Key Dates
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">Posted:</span>
                                                    <span className="font-semibold text-gray-900">{formatDate(fullJob.created_at)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <span className="font-semibold text-gray-900">{formatDate(fullJob.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai-analysis' && application.ai_feedback && (
                            <div className="p-6 lg:p-8 space-y-8">
                                {/* Score Overview */}
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">AI Analysis Overview</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{application.resume_score}%</div>
                                            <div className="text-lg font-semibold text-gray-700">Overall Match Score</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-3">
                                                {application.ai_feedback.objectiveScore}/30
                                            </div>
                                            <div className="text-lg font-semibold text-green-700">Objective Score</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                                            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-3">
                                                {application.ai_feedback.subjectiveScore}/70
                                            </div>
                                            <div className="text-lg font-semibold text-blue-700">Subjective Score</div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Feedback */}
                                {application.ai_feedback.explanationList && (
                                    <div>
                                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Detailed Analysis</h2>
                                        <div className="space-y-4">
                                            {application.ai_feedback.explanationList.map((explanation, index) => {
                                                const isPositive = explanation.toLowerCase().includes('strong') ||
                                                    explanation.toLowerCase().includes('excellent') ||
                                                    explanation.toLowerCase().includes('align') ||
                                                    explanation.toLowerCase().includes('solid');

                                                return (
                                                    <div key={index} className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${isPositive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                        <p className="text-gray-700 text-lg leading-relaxed flex-1">{explanation}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${pendingAction?.newStatus === 'rejected' ? 'bg-red-100' :
                                        pendingAction?.newStatus === 'hired' ? 'bg-green-100' :
                                            'bg-blue-100'
                                        }`}>
                                        {pendingAction?.newStatus === 'rejected' ? (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        ) : pendingAction?.newStatus === 'hired' ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <Send className="w-6 h-6 text-blue-600" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {pendingAction?.newStatus === 'shortlisted' && 'Shortlist Candidate'}
                                        {pendingAction?.newStatus === 'test_scheduled' && 'Assign Test'}
                                        {pendingAction?.newStatus === 'test_completed' && 'Mark Test Completed'}
                                        {pendingAction?.newStatus === 'interview_scheduled' && 'Schedule Interview'}
                                        {pendingAction?.newStatus === 'waiting_for_result' && 'Waiting for Result'}
                                        {pendingAction?.newStatus === 'hired' && 'Hire Candidate'}
                                        {pendingAction?.newStatus === 'rejected' && 'Reject Application'}
                                    </h3>
                                </div>

                                <div className="mb-6">
                                    <p className="text-gray-600 mb-4">
                                        {pendingAction?.newStatus === 'shortlisted' && `Are you sure you want to shortlist ${application.applicant_name} for the ${application.job_title} position?`}
                                        {pendingAction?.newStatus === 'test_scheduled' && `Are you sure you want to assign tests to ${application.applicant_name}?`}
                                        {pendingAction?.newStatus === 'test_completed' && `Are you sure you want to mark tests as completed for ${application.applicant_name}?`}
                                        {pendingAction?.newStatus === 'interview_scheduled' && `Are you sure you want to schedule an interview with ${application.applicant_name}?`}
                                        {pendingAction?.newStatus === 'waiting_for_result' && `Are you sure you want to move ${application.applicant_name} to waiting for result?`}
                                        {pendingAction?.newStatus === 'hired' && `Are you sure you want to hire ${application.applicant_name} for the ${application.job_title} position?`}
                                        {pendingAction?.newStatus === 'rejected' && `Are you sure you want to reject ${application.applicant_name}'s application for the ${application.job_title} position?`}
                                    </p>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            <div className="font-semibold mb-2">This action will:</div>
                                            <ul className="space-y-1 list-disc list-inside">
                                                {pendingAction?.newStatus === 'shortlisted' && (
                                                    <>
                                                        <li>Move candidate to shortlisted pool</li>
                                                        <li>Notify relevant team members</li>
                                                        <li>Update application status</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'test_scheduled' && (
                                                    <>
                                                        <li>Assign selected tests to candidate</li>
                                                        <li>Send test invitation email</li>
                                                        <li>Update application status</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'test_completed' && (
                                                    <>
                                                        <li>Mark test as completed</li>
                                                        <li>Update candidate progress</li>
                                                        <li>Notify hiring team</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'interview_scheduled' && (
                                                    <>
                                                        <li>Schedule interview with candidate</li>
                                                        <li>Send calendar invitation</li>
                                                        <li>Update application status</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'waiting_for_result' && (
                                                    <>
                                                        <li>Move to final decision phase</li>
                                                        <li>Notify hiring managers</li>
                                                        <li>Update application status</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'hired' && (
                                                    <>
                                                        <li>Mark candidate as hired</li>
                                                        <li>Close this application</li>
                                                        <li>Send offer letter</li>
                                                    </>
                                                )}
                                                {pendingAction?.newStatus === 'rejected' && (
                                                    <>
                                                        <li>Reject the application</li>
                                                        <li>Send rejection notification</li>
                                                        <li>Close this application</li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={closeModal}
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAction}
                                        disabled={isUpdating}
                                        className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${pendingAction?.newStatus === 'rejected'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : pendingAction?.newStatus === 'hired'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        {isUpdating ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Updating...
                                            </div>
                                        ) : (
                                            <>
                                                {pendingAction?.newStatus === 'shortlisted' && 'Shortlist Candidate'}
                                                {pendingAction?.newStatus === 'test_scheduled' && 'Assign Tests'}
                                                {pendingAction?.newStatus === 'test_completed' && 'Mark Completed'}
                                                {pendingAction?.newStatus === 'interview_scheduled' && 'Schedule Interview'}
                                                {pendingAction?.newStatus === 'waiting_for_result' && 'Move to Waiting'}
                                                {pendingAction?.newStatus === 'hired' && 'Hire Candidate'}
                                                {pendingAction?.newStatus === 'rejected' && 'Reject Application'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

const AssignTestModal = ({
    isOpen,
    onClose,
    application,
    availableTests,
    selectedTests,
    onSelectedTestsChange,
    testAssignmentSettings,
    onTestAssignmentSettingsChange,
    onConfirmAssignment,
    isAssigning,
    isTestAlreadyAssigned,
    formatDateTime
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Assign Tests to Candidate</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {application.applicant_name} - {application.job_title}
                                </p>
                                <p className="text-blue-600 text-sm mt-1">
                                    {selectedTests.size} test(s) selected
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content - rest of your modal content remains exactly the same */}
                <div className="p-6 space-y-6">
                    {/* Test Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-900">
                                Select Tests *
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (selectedTests.size === availableTests.length) {
                                            onSelectedTestsChange(new Set());
                                        } else {
                                            onSelectedTestsChange(new Set(availableTests.map(test => test.id)));
                                        }
                                    }}
                                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {selectedTests.size === availableTests.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <span className="text-sm text-gray-500">
                                    {selectedTests.size} of {availableTests.length} selected
                                </span>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {availableTests.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No tests available</p>
                                    <p className="text-sm">Create tests in the Tests section first</p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-2">
                                    {availableTests.map((test) => {
                                        const isAlreadyAssigned = isTestAlreadyAssigned(test.id);
                                        const isSelected = selectedTests.has(test.id);

                                        return (
                                            <div
                                                key={test.id}
                                                onClick={() => {
                                                    const newSelectedTests = new Set(selectedTests);
                                                    if (newSelectedTests.has(test.id)) {
                                                        newSelectedTests.delete(test.id);
                                                    } else {
                                                        newSelectedTests.add(test.id);
                                                    }
                                                    onSelectedTestsChange(newSelectedTests);
                                                }}
                                                className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    } ${isAlreadyAssigned ? 'relative overflow-hidden' : ''}`}
                                            >
                                                {isAlreadyAssigned && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">
                                                            Already Assigned
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-semibold text-gray-900">{test.title}</h4>
                                                                {isAlreadyAssigned && (
                                                                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                                                        Will be rescheduled
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {test.duration_minutes} mins
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-4 h-4" />
                                                                    {test.question_count || 'N/A'} questions
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Star className="w-4 h-4" />
                                                                    {test.passing_percentage}% to pass
                                                                </span>
                                                            </div>
                                                            {test.description && (
                                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                                    {test.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                </div>

                                                {isAlreadyAssigned && isSelected && (
                                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <div className="flex items-center gap-2 text-amber-800 text-sm">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span className="font-medium">Note:</span>
                                                            <span>This test is already assigned. Reassigning will update the due date and proctoring settings.</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Tests Summary */}
                    {selectedTests.size > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Selected Tests Summary ({selectedTests.size} test(s))
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {Array.from(selectedTests).map(testId => {
                                    const test = availableTests.find(t => t.id === testId);
                                    if (!test) return null;
                                    const isAlreadyAssigned = isTestAlreadyAssigned(test.id);

                                    return (
                                        <div key={test.id} className="bg-white p-3 rounded-lg border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-blue-900">{test.title}</span>
                                                {isAlreadyAssigned && (
                                                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                                        Rescheduling
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-600 space-y-1">
                                                <div>Duration: {test.duration_minutes} mins</div>
                                                <div>Questions: {test.question_count || 'N/A'}</div>
                                                <div>Passing: {test.passing_percentage}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Test Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Test Start Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={testAssignmentSettings.testStartDate}
                                onChange={(e) => {
                                    const newStartDate = e.target.value;
                                    onTestAssignmentSettingsChange(prev => ({
                                        ...prev,
                                        testStartDate: newStartDate,
                                        testEndDate: prev.testEndDate
                                    }));
                                }}
                                min={new Date().toISOString().slice(0, 16)}
                                className="cursor-pointer w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Test End Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={testAssignmentSettings.testEndDate}
                                onChange={(e) => onTestAssignmentSettingsChange(prev => ({
                                    ...prev,
                                    testEndDate: e.target.value
                                }))}
                                min={testAssignmentSettings.testStartDate || new Date().toISOString().slice(0, 16)}
                                className="cursor-pointer w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Duration Validation */}
                    {testAssignmentSettings.testStartDate && testAssignmentSettings.testEndDate && selectedTests.size > 0 && (
                        <div className="text-sm p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">
                                All selected tests will be available from {formatDateTime(testAssignmentSettings.testStartDate)} to {formatDateTime(testAssignmentSettings.testEndDate)}
                            </p>
                        </div>
                    )}

                    {/* Proctoring Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-purple-600" />
                                Enable Proctoring
                            </label>
                            <button
                                type="button"
                                onClick={() => onTestAssignmentSettingsChange(prev => ({
                                    ...prev,
                                    isProctored: !prev.isProctored
                                }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${testAssignmentSettings.isProctored ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${testAssignmentSettings.isProctored ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {testAssignmentSettings.isProctored && (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Proctoring Settings</h4>
                                {[
                                    { key: 'fullscreen_required', label: 'Fullscreen Required' },
                                    { key: 'tab_switching_detection', label: 'Tab Switching Detection' },
                                    { key: 'copy_paste_prevention', label: 'Copy/Paste Prevention' }
                                ].map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{setting.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => onTestAssignmentSettingsChange(prev => ({
                                                ...prev,
                                                proctoringSettings: {
                                                    ...prev.proctoringSettings,
                                                    [setting.key]: !prev.proctoringSettings[setting.key]
                                                }
                                            }))}
                                            className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${testAssignmentSettings.proctoringSettings[setting.key] ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${testAssignmentSettings.proctoringSettings[setting.key] ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                {selectedTests.size} test(s) selected
                            </span>
                            <button
                                onClick={onConfirmAssignment}
                                disabled={isAssigning || selectedTests.size === 0 || !testAssignmentSettings.testStartDate || !testAssignmentSettings.testEndDate}
                                className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAssigning ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Assigning {selectedTests.size} Test(s)...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Assign {selectedTests.size} Test(s)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InterviewModal = ({
    isOpen,
    onClose,
    application,
    interviewFormData,
    onInterviewFormDataChange,
    availableInterviewers,
    searchInterviewerQuery,
    onSearchInterviewerQueryChange,
    onInterviewerToggle,
    onInterviewSubmit,
    isScheduling,
    interviewTypes,
    meetingPlatforms,
    getSelectedInterviewers,
    formatDateTime
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {application.applicant_name} - {application.job_title}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Application Info */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-600" />
                            <div>
                                <div className="font-semibold text-gray-900">{application.applicant_name}</div>
                                <div className="text-gray-600">Candidate</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-600" />
                            <div>
                                <div className="font-semibold text-gray-900">{application.applicant_email}</div>
                                <div className="text-gray-600">Email</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-gray-600" />
                            <div>
                                <div className="font-semibold text-gray-900">{application.job_title}</div>
                                <div className="text-gray-600">Position</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <div>
                                <div className="font-semibold text-gray-900">{application.location}</div>
                                <div className="text-gray-600">Location</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={onInterviewSubmit} className="p-6 space-y-6">
                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Interview Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={interviewFormData.scheduledAt}
                                onChange={(e) => onInterviewFormDataChange('scheduledAt', e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Duration (minutes) *
                            </label>
                            <select
                                value={interviewFormData.durationMinutes}
                                onChange={(e) => onInterviewFormDataChange('durationMinutes', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={90}>90 minutes</option>
                                <option value={120}>120 minutes</option>
                            </select>
                        </div>
                    </div>

                    {/* Interview Type & Platform */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Interview Type *
                            </label>
                            <select
                                value={interviewFormData.interviewType}
                                onChange={(e) => onInterviewFormDataChange('interviewType', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            >
                                {interviewTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Meeting Platform *
                            </label>
                            <select
                                value={interviewFormData.meetingPlatform}
                                onChange={(e) => onInterviewFormDataChange('meetingPlatform', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            >
                                {meetingPlatforms.map(platform => (
                                    <option key={platform.value} value={platform.value}>
                                        {platform.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Meeting Details */}
                    {interviewFormData.meetingPlatform === 'in_person' ? (
                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Meeting Location *
                            </label>
                            <input
                                type="text"
                                value={interviewFormData.meetingLocation}
                                onChange={(e) => onInterviewFormDataChange('meetingLocation', e.target.value)}
                                placeholder="Enter meeting room or address"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>
                    ) : interviewFormData.meetingPlatform !== 'phone' ? (
                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Meeting Link *
                            </label>
                            <input
                                type="url"
                                value={interviewFormData.meetingLink}
                                onChange={(e) => onInterviewFormDataChange('meetingLink', e.target.value)}
                                placeholder="Enter meeting URL"
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>
                    ) : null}

                    {/* Interviewers Selection */}
                    <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Select Interviewers *
                        </label>

                        {/* Search */}
                        <input
                            type="text"
                            value={searchInterviewerQuery}
                            onChange={(e) => onSearchInterviewerQueryChange(e.target.value)}
                            placeholder="Search interviewers by name or email..."
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors mb-3"
                        />

                        {/* Selected Interviewers */}
                        {getSelectedInterviewers().length > 0 && (
                            <div className="mb-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">Selected Interviewers:</div>
                                <div className="flex flex-wrap gap-2">
                                    {getSelectedInterviewers().map(interviewer => (
                                        <div
                                            key={interviewer.id}
                                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                        >
                                            <User className="w-3 h-3" />
                                            {interviewer.name}
                                            <button
                                                type="button"
                                                onClick={() => onInterviewerToggle(interviewer.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interviewers List */}
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                            {availableInterviewers.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    No interviewers found
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {availableInterviewers.map(interviewer => (
                                        <div
                                            key={interviewer.id}
                                            onClick={() => onInterviewerToggle(interviewer.id)}
                                            className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${interviewFormData.interviewers.includes(interviewer.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-5 h-5">
                                                        <input
                                                            type="checkbox"
                                                            checked={interviewFormData.interviewers.includes(interviewer.id)}
                                                            onChange={() => { }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {interviewer.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {interviewer.email} • {interviewer.role}
                                                        </div>
                                                    </div>
                                                </div>
                                                {interviewFormData.interviewers.includes(interviewer.id) && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Additional Notes
                        </label>
                        <textarea
                            value={interviewFormData.notes}
                            onChange={(e) => onInterviewFormDataChange('notes', e.target.value)}
                            placeholder="Add any special instructions, agenda items, or notes for the interview..."
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Interview Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><strong>Type:</strong> {interviewTypes.find(t => t.value === interviewFormData.interviewType)?.label}</div>
                            <div><strong>Platform:</strong> {meetingPlatforms.find(p => p.value === interviewFormData.meetingPlatform)?.label}</div>
                            <div><strong>Duration:</strong> {interviewFormData.durationMinutes} minutes</div>
                            <div><strong>Interviewers:</strong> {getSelectedInterviewers().length} selected</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isScheduling || !interviewFormData.scheduledAt || interviewFormData.interviewers.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isScheduling ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-4 h-4" />
                                    Schedule Interview
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RescheduleTestModal = ({
    isOpen,
    onClose,
    testAssignment,
    rescheduleSettings,
    onRescheduleSettingsChange,
    onConfirmReschedule,
    isRescheduling,
    formatDateTime
}) => {
    if (!isOpen || !testAssignment) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <RefreshCw className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Reschedule Test</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {testAssignment.test_title}
                                </p>
                                <p className="text-blue-600 text-sm mt-1">
                                    Current window: {formatDateTime(testAssignment.test_start_date)} to {formatDateTime(testAssignment.test_end_date)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Test Details */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Test Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-semibold ml-2">{testAssignment.duration_minutes} mins</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Current Status:</span>
                                <span className="font-semibold ml-2 capitalize">{testAssignment.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* New Test Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                New Start Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={rescheduleSettings.testStartDate}
                                onChange={(e) => onRescheduleSettingsChange({
                                    ...rescheduleSettings,
                                    testStartDate: e.target.value
                                })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                New End Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={rescheduleSettings.testEndDate}
                                onChange={(e) => onRescheduleSettingsChange({
                                    ...rescheduleSettings,
                                    testEndDate: e.target.value
                                })}
                                min={rescheduleSettings.testStartDate || new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Duration Validation */}
                    {rescheduleSettings.testStartDate && rescheduleSettings.testEndDate && (
                        <div className="text-sm p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-600">
                                Test will be available from {formatDateTime(rescheduleSettings.testStartDate)} to {formatDateTime(rescheduleSettings.testEndDate)}
                            </p>
                        </div>
                    )}

                    {/* Proctoring Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-purple-600" />
                                Enable Proctoring
                            </label>
                            <button
                                type="button"
                                onClick={() => onRescheduleSettingsChange({
                                    ...rescheduleSettings,
                                    isProctored: !rescheduleSettings.isProctored
                                })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${rescheduleSettings.isProctored ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rescheduleSettings.isProctored ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        {rescheduleSettings.isProctored && (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Proctoring Settings</h4>
                                {[
                                    { key: 'fullscreen_required', label: 'Fullscreen Required' },
                                    { key: 'tab_switching_detection', label: 'Tab Switching Detection' },
                                    { key: 'copy_paste_prevention', label: 'Copy/Paste Prevention' }
                                ].map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{setting.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => onRescheduleSettingsChange({
                                                ...rescheduleSettings,
                                                proctoringSettings: {
                                                    ...rescheduleSettings.proctoringSettings,
                                                    [setting.key]: !rescheduleSettings.proctoringSettings[setting.key]
                                                }
                                            })}
                                            className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${rescheduleSettings.proctoringSettings[setting.key] ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rescheduleSettings.proctoringSettings[setting.key] ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Important Note */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-1">Important</h4>
                                <p className="text-amber-800 text-sm">
                                    Rescheduling this test will reset the candidate's progress and allow them to retake the test
                                    within the new time window. Any previous attempts will be archived.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmReschedule}
                            disabled={isRescheduling || !rescheduleSettings.testStartDate || !rescheduleSettings.testEndDate}
                            className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRescheduling ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Rescheduling...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Reschedule Test
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RescheduleInterviewModal = ({
    isOpen,
    onClose,
    interview,
    rescheduleData,
    onRescheduleDataChange,
    onConfirmReschedule,
    isRescheduling,
    formatDateTime,
    interviewTypes
}) => {
    if (!isOpen || !interview) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <RefreshCw className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Reschedule Interview</h3>
                                <p className="text-gray-600 text-sm mt-1">
                                    {interviewTypes.find(t => t.value === interview.interview_type)?.label || 'Interview'}
                                </p>
                                <p className="text-purple-600 text-sm mt-1">
                                    Current time: {formatDateTime(interview.scheduled_at)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Interview Details */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Interview Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Current Duration:</span>
                                <span className="font-semibold ml-2">{interview.duration_minutes} mins</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Platform:</span>
                                <span className="font-semibold ml-2 capitalize">{interview.meeting_platform?.replace('_', ' ') || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Interviewers:</span>
                                <span className="font-semibold ml-2">{interview.interviewer_names?.length || 0}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Current Status:</span>
                                <span className="font-semibold ml-2 capitalize">{interview.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* New Interview Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                New Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={rescheduleData.scheduledAt}
                                onChange={(e) => onRescheduleDataChange('scheduledAt', e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Duration (minutes) *
                            </label>
                            <select
                                value={rescheduleData.durationMinutes}
                                onChange={(e) => onRescheduleDataChange('durationMinutes', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                                <option value={90}>90 minutes</option>
                                <option value={120}>120 minutes</option>
                            </select>
                        </div>
                    </div>

                    {/* Reschedule Notes */}
                    <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Reschedule Notes (Optional)
                        </label>
                        <textarea
                            value={rescheduleData.notes}
                            onChange={(e) => onRescheduleDataChange('notes', e.target.value)}
                            placeholder="Add reason for rescheduling or any additional notes..."
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                        />
                    </div>

                    {/* Important Note */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-1">Important</h4>
                                <p className="text-amber-800 text-sm">
                                    Rescheduling this interview will notify the candidate and all interviewers about the new time.
                                    The interview status will be updated to "scheduled".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmReschedule}
                            disabled={isRescheduling || !rescheduleData.scheduledAt}
                            className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRescheduling ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Rescheduling...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Reschedule Interview
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CompleteInterviewModal = ({
    isOpen,
    onClose,
    interview,
    onConfirm,
    isUpdating,
    notes,
    onNotesChange,
    interviewTypes,
    formatDateTime
}) => {
    if (!isOpen || !interview) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-y-auto">
                {/* Header - Fixed */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Mark Interview as Completed</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                Confirm that this interview has been completed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Interview Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Type:</strong> {interviewTypes.find(t => t.value === interview.interview_type)?.label}</div>
                            <div><strong>Date:</strong> {formatDateTime(interview.scheduled_at)}</div>
                            <div><strong>Duration:</strong> {interview.duration_minutes} minutes</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Completion Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add any notes about the interview completion..."
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <strong>Note:</strong> This action will mark the interview as completed and update the application status if needed.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Mark as Completed
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CancelInterviewModal = ({
    isOpen,
    onClose,
    interview,
    onConfirm,
    isUpdating,
    notes,
    onNotesChange,
    interviewTypes,
    formatDateTime
}) => {
    if (!isOpen || !interview) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4 max-h-screen">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col">
                {/* Header - Fixed */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Cancel Interview</h3>
                            <p className="text-gray-600 text-sm mt-1">
                                Confirm cancellation of this interview
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Interview Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Type:</strong> {interviewTypes.find(t => t.value === interview.interview_type)?.label}</div>
                            <div><strong>Date:</strong> {formatDateTime(interview.scheduled_at)}</div>
                            <div><strong>Duration:</strong> {interview.duration_minutes} minutes</div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Cancellation Reason (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            placeholder="Add reason for cancellation..."
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                        />
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-800">
                                <strong>Warning:</strong> This action cannot be undone. The candidate and interviewers will be notified about the cancellation.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="cursor-pointer px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 transition-colors"
                    >
                        Keep Interview
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isUpdating}
                        className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUpdating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4" />
                                Cancel Interview
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};