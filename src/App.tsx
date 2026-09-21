import React, { useState, useEffect } from 'react';
import { Course, Role, StudentProfile, InstructorProfile, UserProgress, CourseChangeRequest, CourseReview } from './types';
import { INITIAL_COURSES } from './data/mockCourses';
import { INITIAL_REVIEWS } from './data/mockReviews';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CourseCatalog } from './components/CourseCatalog';
import { CoursePlayer } from './components/CoursePlayer';
import { QuizEngine } from './components/QuizEngine';
import { CertificateModal } from './components/CertificateModal';
import { AITutorDrawer } from './components/AITutorDrawer';
import { AICourseGeneratorModal } from './components/AICourseGeneratorModal';
import { StudentDashboard } from './components/StudentDashboard';
import { InstructorStudio } from './components/InstructorStudio';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { InstructorRegistrationModal } from './components/InstructorRegistrationModal';
import { AddUserTypeModal } from './components/AddUserTypeModal';
import { PlatformOwnerAdminModal } from './components/PlatformOwnerAdminModal';
import { AddCourseModal } from './components/AddCourseModal';
import {
  subscribeToCourses,
  subscribeToCourseRequests,
  subscribeToStudents,
  subscribeToInstructors,
  subscribeToReviews,
  seedInitialCoursesIfEmpty,
  saveCourseToCloud,
  deleteCourseFromCloud,
  submitCourseRequestToCloud,
  deleteCourseRequestFromCloud,
  saveStudentToCloud,
  deleteStudentFromCloud,
  saveInstructorToCloud,
  deleteInstructorFromCloud,
  saveReviewToCloud,
  deleteReviewFromCloud,
  testFirestoreConnection
} from './services/realtimeSync';

export default function App() {
  // Real-Time Cloud Sync State
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<Role>('student');
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard' | 'instructor'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  // Student Profile State (saved in localStorage)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('edu_student_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Pending Student Requests (waiting for platform owner approval)
  const [pendingStudentRequests, setPendingStudentRequests] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Deleted Student Emails (deleted by platform owner)
  const [deletedStudentEmails, setDeletedStudentEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Extra Registered Students (persisted across sessions)
  const [extraRegisteredStudents, setExtraRegisteredStudents] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_registered_students');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Pending Instructor Requests (waiting for platform owner approval)
  const [pendingInstructorRequests, setPendingInstructorRequests] = useState<InstructorProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Pending Course Requests (waiting for platform owner approval)
  const [pendingCourseRequests, setPendingCourseRequests] = useState<CourseChangeRequest[]>(() => {
    try {
      const saved = localStorage.getItem('edu_pending_course_requests');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Deleted Instructor Emails (deleted by platform owner)
  const [deletedInstructorEmails, setDeletedInstructorEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu_deleted_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Extra Registered Instructors (persisted across sessions)
  const [extraRegisteredInstructors, setExtraRegisteredInstructors] = useState<InstructorProfile[]>(() => {
    try {
      const saved = localStorage.getItem('edu_registered_instructors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Instructor Profile State (saved in localStorage)
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(() => {
    try {
      const saved = localStorage.getItem('edu_instructor_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);
  const [isInstructorRegistrationModalOpen, setIsInstructorRegistrationModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pendingCourseToStart, setPendingCourseToStart] = useState<Course | null>(null);

  // Owner Session State (Owner button is strictly ONLY visible when in Owner session)
  const [isOwnerSession, setIsOwnerSession] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('edu_is_owner_session');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.error(e);
    }
    const hasStudent = !!localStorage.getItem('edu_student_profile');
    const hasInstructor = !!localStorage.getItem('edu_instructor_profile');
    return !hasStudent && !hasInstructor;
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('edu_dark_mode') === 'true';
  });

  // Courses List State (persists all customized/updated/AI generated courses)
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const savedAll = localStorage.getItem('edu_all_courses_v2');
      if (savedAll) {
        const parsed: Course[] = JSON.parse(savedAll);
        return parsed.map((c) => {
          const initMatch = INITIAL_COURSES.find((ic) => ic.id === c.id);
          if (initMatch) {
            return {
              ...c,
              quiz: initMatch.quiz && (!c.quiz || c.quiz.questions.length < initMatch.quiz.questions.length) ? initMatch.quiz : (c.quiz || initMatch.quiz),
              modules: initMatch.modules,
            };
          }
          return c;
        });
      }
      const saved = localStorage.getItem('edu_custom_courses');
      if (saved) {
        const parsed: Course[] = JSON.parse(saved);
        // Only keep custom user/AI created courses from localStorage that are not part of INITIAL_COURSES
        const customOnly = parsed.filter(c => !INITIAL_COURSES.some(ic => ic.id === c.id));
        const sanitizedCustom = customOnly.map(c => ({
          ...c,
          modules: c.modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => {
              if (!l.videoUrl || l.videoUrl.includes('SqcY0GlETPk') || l.videoUrl.includes('k3Vfj-e1Ma4') || l.videoUrl.includes('345fX1E00-c') || l.videoUrl.includes('2eWuYf-aZE4') || l.videoUrl.includes('jC4v5AS4RIM') || l.videoUrl.includes('zjkBMFhNj_g') || l.videoUrl.includes('jwA1S-Rrhsc') || l.videoUrl.includes('kqtD5dpn9C8') || l.videoUrl.includes('vmEHCJofslg') || l.videoUrl.includes('Gv9_4yMHFhI') || l.videoUrl.includes('inWWhr5tnEA') || l.videoUrl.includes('nzj7Wg4DAbs') || l.videoUrl.includes('3Kq1MIfTWCE') || l.videoUrl.includes('FTL047M_Gms')) {
                return { ...l, videoUrl: 'https://www.youtube.com/watch?v=6QAELgirvjs' };
              }
              return l;
            })
          }))
        }));
        return [...INITIAL_COURSES, ...sanitizedCustom];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COURSES;
  });

  // User Progress Map State (courseId -> UserProgress)
  const [userProgressMap, setUserProgressMap] = useState<Record<string, UserProgress>>(() => {
    try {
      const saved = localStorage.getItem('edu_user_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      'course-react-ts': {
        courseId: 'course-react-ts',
        completedLessonIds: ['les-1-1'],
        quizScores: {},
        isCompleted: false,
        lastStudiedAt: new Date().toISOString()
      }
    };
  });

  // Active Selected Course for Player View
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Active Modals State
  const [activeQuizCourse, setActiveQuizCourse] = useState<Course | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseToEditId, setCourseToEditId] = useState<string | null>(null);

  // Course Reviews State (persisted and synced across devices)
  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    try {
      const saved = localStorage.getItem('edu_course_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REVIEWS;
  });

  // Dark Mode side effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('edu_dark_mode', String(darkMode));
  }, [darkMode]);

  // Save Reviews to localStorage
  useEffect(() => {
    localStorage.setItem('edu_course_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Save Progress to localStorage
  useEffect(() => {
    localStorage.setItem('edu_user_progress', JSON.stringify(userProgressMap));
  }, [userProgressMap]);

  // Real-Time Cross-Device Sync with Firebase
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    seedInitialCoursesIfEmpty(INITIAL_COURSES);

    const unsubCourses = subscribeToCourses((cloudCourses) => {
      if (cloudCourses && cloudCourses.length > 0) {
        const merged = cloudCourses.map((c) => {
          const initMatch = INITIAL_COURSES.find((ic) => ic.id === c.id);
          if (initMatch) {
            return {
              ...c,
              quiz: initMatch.quiz && (!c.quiz || c.quiz.questions.length < initMatch.quiz.questions.length) ? initMatch.quiz : (c.quiz || initMatch.quiz),
              modules: initMatch.modules,
            };
          }
          return c;
        });
        setCourses(merged);
        persistCourses(merged);
      }
    });

    const unsubRequests = subscribeToCourseRequests((cloudRequests) => {
      setPendingCourseRequests(cloudRequests);
      localStorage.setItem('edu_pending_course_requests', JSON.stringify(cloudRequests));
    });

    const unsubStudents = subscribeToStudents((cloudStudents) => {
      setExtraRegisteredStudents(cloudStudents);
      localStorage.setItem('edu_registered_students', JSON.stringify(cloudStudents));
    });

    const unsubInstructors = subscribeToInstructors((cloudInstructors) => {
      setExtraRegisteredInstructors(cloudInstructors);
      localStorage.setItem('edu_registered_instructors', JSON.stringify(cloudInstructors));
    });

    const unsubReviews = subscribeToReviews((cloudReviews) => {
      if (cloudReviews && cloudReviews.length > 0) {
        setReviews(cloudReviews);
        localStorage.setItem('edu_course_reviews', JSON.stringify(cloudReviews));
      }
    });

    return () => {
      unsubCourses();
      unsubRequests();
      unsubStudents();
      unsubInstructors();
      unsubReviews();
    };
  }, []);

  // Handle Add New Review with Real-time & Optimistic Average Recalculation
  const handleAddReview = async (newReviewData: Omit<CourseReview, 'id' | 'createdAt'>) => {
    const newReview: CourseReview = {
      ...newReviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic reviews update
    setReviews((prev) => [newReview, ...prev]);

    // 2. Recalculate course average rating and count locally
    const existingCourseReviews = reviews.filter((r) => r.courseId === newReview.courseId);
    const allCourseReviews = [newReview, ...existingCourseReviews];
    const newAverage = Math.round((allCourseReviews.reduce((sum, r) => sum + r.rating, 0) / allCourseReviews.length) * 10) / 10;
    const newCount = allCourseReviews.length;

    setCourses((prev) => {
      const updated = prev.map((c) => (c.id === newReview.courseId ? { ...c, rating: newAverage, reviewsCount: newCount } : c));
      persistCourses(updated);
      return updated;
    });

    if (selectedCourse && selectedCourse.id === newReview.courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, rating: newAverage, reviewsCount: newCount } : null));
    }

    // 3. Persist to Firestore cloud database
    try {
      await saveReviewToCloud(newReview);
    } catch (err) {
      console.warn('Failed to sync review to Firestore:', err);
    }
  };

  // Handle Delete Review (by owner or author)
  const handleDeleteReview = async (reviewId: string) => {
    const targetReview = reviews.find((r) => r.id === reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));

    if (targetReview) {
      const remainingReviews = reviews.filter((r) => r.courseId === targetReview.courseId && r.id !== reviewId);
      const newAverage = remainingReviews.length > 0
        ? Math.round((remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length) * 10) / 10
        : 5.0;
      const newCount = remainingReviews.length;

      setCourses((prev) => {
        const updated = prev.map((c) => (c.id === targetReview.courseId ? { ...c, rating: newAverage, reviewsCount: newCount } : c));
        persistCourses(updated);
        return updated;
      });

      if (selectedCourse && selectedCourse.id === targetReview.courseId) {
        setSelectedCourse((prev) => (prev ? { ...prev, rating: newAverage, reviewsCount: newCount } : null));
      }
    }

    try {
      await deleteReviewFromCloud(reviewId);
    } catch (err) {
      console.warn('Failed to delete review from Firestore:', err);
    }
  };

  // Toggle Lesson Completion
  const handleToggleLessonComplete = (courseId: string, lessonId: string) => {
    setUserProgressMap((prev) => {
      const current = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizScores: {},
        isCompleted: false,
        lastStudiedAt: new Date().toISOString()
      };

      const isCompleted = current.completedLessonIds.includes(lessonId);
      const updatedLessonIds = isCompleted
        ? current.completedLessonIds.filter((id) => id !== lessonId)
        : [...current.completedLessonIds, lessonId];

      const targetCourse = courses.find((c) => c.id === courseId);
      const totalLessonsCount = targetCourse
        ? targetCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0)
        : 0;

      const courseFullyDone = updatedLessonIds.length === totalLessonsCount && totalLessonsCount > 0;

      return {
        ...prev,
        [courseId]: {
          ...current,
          completedLessonIds: updatedLessonIds,
          isCompleted: courseFullyDone,
          lastStudiedAt: new Date().toISOString()
        }
      };
    });
  };

  // Helper to persist courses safely
  const persistCourses = (updatedCourses: Course[]) => {
    try {
      localStorage.setItem('edu_all_courses_v2', JSON.stringify(updatedCourses));
      const customOnly = updatedCourses.filter((c) => c.id.startsWith('custom-course') || c.id.startsWith('course-ai'));
      localStorage.setItem('edu_custom_courses', JSON.stringify(customOnly));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Custom or AI-Generated Course
  const handleAddCourse = (newCourse: Course) => {
    setCourses((prev) => {
      const updated = [newCourse, ...prev.filter((c) => c.id !== newCourse.id)];
      persistCourses(updated);
      return updated;
    });
    saveCourseToCloud(newCourse).catch((err) => console.warn('Failed to sync course to cloud:', err));
  };

  // Update or Replace an Existing Course
  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses((prev) => {
      const updated = prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
      persistCourses(updated);
      return updated;
    });
    if (selectedCourse?.id === updatedCourse.id) {
      setSelectedCourse(updatedCourse);
    }
    saveCourseToCloud(updatedCourse).catch((err) => console.warn('Failed to sync course to cloud:', err));
  };

  // Open Course Modals
  const handleOpenAddCourse = () => {
    setCourseToEditId(null);
    setIsAddCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setCourseToEditId(course.id);
    setIsAddCourseModalOpen(true);
  };

  // Handle Quiz Finished
  const handleFinishQuiz = (courseId: string, scorePercent: number) => {
    setUserProgressMap((prev) => {
      const current = prev[courseId] || {
        courseId,
        completedLessonIds: [],
        quizScores: {},
        isCompleted: false,
        lastStudiedAt: new Date().toISOString()
      };

      const isPassed = scorePercent >= 70;

      return {
        ...prev,
        [courseId]: {
          ...current,
          quizScores: { ...current.quizScores, [courseId]: scorePercent },
          isCompleted: isPassed ? true : current.isCompleted,
          certificateIssuedAt: isPassed ? new Date().toISOString() : current.certificateIssuedAt
        }
      };
    });
  };

  // Enrolled courses list
  const enrolledCourses = courses.filter((c) => userProgressMap[c.id]);

  // Handle Saving Student Profile Data
  const handleSaveProfile = (profile: StudentProfile) => {
    const cleanEmail = profile.email.trim().toLowerCase();
    const isApproved = extraRegisteredStudents.some((s) => s.email.trim().toLowerCase() === cleanEmail) ||
                       (studentProfile && studentProfile.email.trim().toLowerCase() === cleanEmail);
    const isDeleted = deletedStudentEmails.includes(cleanEmail);

    if (!isApproved || isDeleted) {
      // Send to pending approval requests
      setPendingStudentRequests((prev) => {
        const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
        const updated = [...filtered, profile];
        localStorage.setItem('edu_pending_students', JSON.stringify(updated));
        return updated;
      });
      if (studentProfile && studentProfile.email.trim().toLowerCase() === cleanEmail && !isApproved) {
        setStudentProfile(null);
        localStorage.removeItem('edu_student_profile');
      }
      return { isPending: true };
    }

    // Normal Registration for ALREADY APPROVED student
    setStudentProfile(profile);
    localStorage.setItem('edu_student_profile', JSON.stringify(profile));
    setIsOwnerSession(false);
    localStorage.setItem('edu_is_owner_session', 'false');
    setExtraRegisteredStudents((prev) => {
      const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      const updated = [...filtered, profile];
      localStorage.setItem('edu_registered_students', JSON.stringify(updated));
      return updated;
    });

    if (pendingCourseToStart) {
      setSelectedCourse(pendingCourseToStart);
      setPendingCourseToStart(null);
    }
    return { isPending: false };
  };

  // Admin Approve Pending Student Request
  const handleApproveStudentRequest = (email: string) => {
    const cleanEmail = email.toLowerCase();
    const target = pendingStudentRequests.find((p) => p.email.toLowerCase() === cleanEmail);

    // 1. Remove from deleted
    setDeletedStudentEmails((prev) => {
      const updated = prev.filter((e) => e.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_deleted_students', JSON.stringify(updated));
      return updated;
    });

    // 2. Remove from pending
    setPendingStudentRequests((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_pending_students', JSON.stringify(updated));
      return updated;
    });

    if (target) {
      // 3. Add to extraRegisteredStudents
      setExtraRegisteredStudents((prev) => {
        const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
        const updated = [...filtered, target];
        localStorage.setItem('edu_registered_students', JSON.stringify(updated));
        return updated;
      });
      saveStudentToCloud(target).catch((err) => console.warn('Failed to save student to cloud:', err));

      // 4. Activate profile if current browser user
      setStudentProfile(target);
      localStorage.setItem('edu_student_profile', JSON.stringify(target));
    }
  };

  // Admin Reject Pending Student Request
  const handleRejectStudentRequest = (email: string) => {
    const cleanEmail = email.toLowerCase();
    setPendingStudentRequests((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_pending_students', JSON.stringify(updated));
      return updated;
    });
  };

  // Admin Delete Student Profile
  const handleDeleteStudentByAdmin = (email: string) => {
    const cleanEmail = email.toLowerCase();

    // 1. Add to deleted list
    setDeletedStudentEmails((prev) => {
      if (prev.includes(cleanEmail)) return prev;
      const updated = [...prev, cleanEmail];
      localStorage.setItem('edu_deleted_students', JSON.stringify(updated));
      return updated;
    });

    // 2. Remove from extra registered
    setExtraRegisteredStudents((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_registered_students', JSON.stringify(updated));
      return updated;
    });

    // Sync deletion to Firestore cloud
    deleteStudentFromCloud(cleanEmail).catch((err) => console.warn('Failed to delete student from cloud:', err));

    // 3. Logout if current active student
    if (studentProfile?.email?.toLowerCase() === cleanEmail) {
      setStudentProfile(null);
      localStorage.removeItem('edu_student_profile');
    }
  };

  // Logout Student
  const handleLogoutStudent = () => {
    setStudentProfile(null);
    localStorage.removeItem('edu_student_profile');
  };

  // Logout Instructor
  const handleLogoutInstructor = () => {
    setInstructorProfile(null);
    localStorage.removeItem('edu_instructor_profile');
  };

  // Handle Saving Instructor Profile Data
  const handleSaveInstructorProfile = (profile: InstructorProfile) => {
    const cleanEmail = profile.email.trim().toLowerCase();
    const isApproved = extraRegisteredInstructors.some((i) => i.email.trim().toLowerCase() === cleanEmail) ||
                       (instructorProfile && instructorProfile.email.trim().toLowerCase() === cleanEmail);
    const isDeleted = deletedInstructorEmails.includes(cleanEmail);

    if (!isApproved || isDeleted) {
      // Send to pending instructor approval requests
      setPendingInstructorRequests((prev) => {
        const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
        const updated = [...filtered, profile];
        localStorage.setItem('edu_pending_instructors', JSON.stringify(updated));
        return updated;
      });
      if (instructorProfile && instructorProfile.email.trim().toLowerCase() === cleanEmail && !isApproved) {
        setInstructorProfile(null);
        localStorage.removeItem('edu_instructor_profile');
      }
      return { isPending: true };
    }

    // Normal Registration for ALREADY APPROVED instructor
    setInstructorProfile(profile);
    localStorage.setItem('edu_instructor_profile', JSON.stringify(profile));
    setIsOwnerSession(false);
    localStorage.setItem('edu_is_owner_session', 'false');
    setExtraRegisteredInstructors((prev) => {
      const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      const updated = [...filtered, profile];
      localStorage.setItem('edu_registered_instructors', JSON.stringify(updated));
      return updated;
    });

    return { isPending: false };
  };

  // Admin Approve Pending Instructor Request
  const handleApproveInstructorRequest = (email: string) => {
    const cleanEmail = email.toLowerCase();
    const target = pendingInstructorRequests.find((p) => p.email.toLowerCase() === cleanEmail);

    // 1. Remove from deleted
    setDeletedInstructorEmails((prev) => {
      const updated = prev.filter((e) => e.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_deleted_instructors', JSON.stringify(updated));
      return updated;
    });

    // 2. Remove from pending
    setPendingInstructorRequests((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_pending_instructors', JSON.stringify(updated));
      return updated;
    });

    if (target) {
      // 3. Add to extra registered instructors
      setExtraRegisteredInstructors((prev) => {
        const filtered = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
        const updated = [...filtered, target];
        localStorage.setItem('edu_registered_instructors', JSON.stringify(updated));
        return updated;
      });
      saveInstructorToCloud(target).catch((err) => console.warn('Failed to save instructor to cloud:', err));

      // 4. Activate profile
      setInstructorProfile(target);
      localStorage.setItem('edu_instructor_profile', JSON.stringify(target));
    }
  };

  // Admin Reject Pending Instructor Request
  const handleRejectInstructorRequest = (email: string) => {
    const cleanEmail = email.toLowerCase();
    setPendingInstructorRequests((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_pending_instructors', JSON.stringify(updated));
      return updated;
    });
  };

  // Admin Delete Instructor Profile
  const handleDeleteInstructorByAdmin = (email: string) => {
    const cleanEmail = email.toLowerCase();

    // 1. Add to deleted list
    setDeletedInstructorEmails((prev) => {
      if (prev.includes(cleanEmail)) return prev;
      const updated = [...prev, cleanEmail];
      localStorage.setItem('edu_deleted_instructors', JSON.stringify(updated));
      return updated;
    });

    // 2. Remove from extra registered
    setExtraRegisteredInstructors((prev) => {
      const updated = prev.filter((p) => p.email.toLowerCase() !== cleanEmail);
      localStorage.setItem('edu_registered_instructors', JSON.stringify(updated));
      return updated;
    });

    // Sync deletion to Firestore cloud
    deleteInstructorFromCloud(cleanEmail).catch((err) => console.warn('Failed to delete instructor from cloud:', err));

    // 3. Logout if active instructor
    if (instructorProfile?.email?.toLowerCase() === cleanEmail) {
      setInstructorProfile(null);
      localStorage.removeItem('edu_instructor_profile');
    }
  };

  // Handle Role Change
  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    setSelectedCourse(null);
    if (role === 'instructor') {
      setActiveTab('instructor');
      if (!instructorProfile) {
        setIsInstructorRegistrationModalOpen(true);
      }
    } else {
      setActiveTab('catalog');
    }
  };

  // Handle Delete Course (for Admin / Platform Owner or Modal)
  const handleDeleteCourse = (courseId: string) => {
    setCourses((prev) => {
      const updated = prev.filter((c) => c.id !== courseId);
      persistCourses(updated);
      return updated;
    });
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(null);
    }
    deleteCourseFromCloud(courseId).catch((err) => console.warn('Failed to delete course from cloud:', err));
  };

  // Submit Course Request for Admin Approval (when added or updated by lecturer)
  const handleRequestCourseChange = (request: CourseChangeRequest) => {
    setPendingCourseRequests((prev) => {
      const filtered = prev.filter((r) => r.id !== request.id);
      const updated = [request, ...filtered];
      localStorage.setItem('edu_pending_course_requests', JSON.stringify(updated));
      return updated;
    });
    submitCourseRequestToCloud(request).catch((err) => console.warn('Failed to submit course request to cloud:', err));
  };

  // Admin Approve Course Change/Addition Request
  const handleApproveCourseRequest = (requestId: string) => {
    const target = pendingCourseRequests.find((r) => r.id === requestId);
    if (!target) return;

    if (target.type === 'create') {
      handleAddCourse(target.courseData);
    } else if (target.type === 'update') {
      handleUpdateCourse(target.courseData);
    } else if (target.type === 'delete') {
      handleDeleteCourse(target.courseId);
    }

    setPendingCourseRequests((prev) => {
      const updated = prev.filter((r) => r.id !== requestId);
      localStorage.setItem('edu_pending_course_requests', JSON.stringify(updated));
      return updated;
    });
    deleteCourseRequestFromCloud(requestId).catch((err) => console.warn('Failed to delete request from cloud:', err));
  };

  // Admin Reject Course Request
  const handleRejectCourseRequest = (requestId: string) => {
    setPendingCourseRequests((prev) => {
      const updated = prev.filter((r) => r.id !== requestId);
      localStorage.setItem('edu_pending_course_requests', JSON.stringify(updated));
      return updated;
    });
    deleteCourseRequestFromCloud(requestId).catch((err) => console.warn('Failed to reject request from cloud:', err));
  };

  // Handle Delete Student Profile (for Admin)
  const handleDeleteStudentProfile = () => {
    setStudentProfile(null);
    localStorage.removeItem('edu_student_profile');
  };

  // Handle Delete Instructor Profile (for Admin)
  const handleDeleteInstructorProfile = () => {
    setInstructorProfile(null);
    localStorage.removeItem('edu_instructor_profile');
  };

  // Handle Select Course (verifies student registration before opening player)
  const handleSelectCourse = (course: Course) => {
    if (!studentProfile) {
      setPendingCourseToStart(course);
      setIsRegistrationModalOpen(true);
    } else {
      setSelectedCourse(course);
    }
  };

  // Handle Direct Multi-Account Selection on Device
  const handleSelectActiveStudent = (student: StudentProfile) => {
    setStudentProfile(student);
    localStorage.setItem('edu_student_profile', JSON.stringify(student));
    setIsOwnerSession(false);
    localStorage.setItem('edu_is_owner_session', 'false');
    setCurrentRole('student');
    setActiveTab('catalog');
    setSelectedCourse(null);
  };

  const handleSelectActiveInstructor = (instructor: InstructorProfile) => {
    setInstructorProfile(instructor);
    localStorage.setItem('edu_instructor_profile', JSON.stringify(instructor));
    setIsOwnerSession(false);
    localStorage.setItem('edu_is_owner_session', 'false');
    setCurrentRole('instructor');
    setActiveTab('instructor');
    setSelectedCourse(null);
  };

  const handleSelectOwner = () => {
    setIsOwnerSession(true);
    localStorage.setItem('edu_is_owner_session', 'true');
    setIsAdminModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Top Navbar Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedCourse(null);
          setActiveTab(tab);
          if (tab === 'instructor' && !instructorProfile) {
            setIsInstructorRegistrationModalOpen(true);
          }
        }}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        onOpenAddCourseModal={handleOpenAddCourse}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        courses={courses}
        onSelectCourse={handleSelectCourse}
        completedCoursesCount={(Object.values(userProgressMap) as UserProgress[]).filter((p) => p.isCompleted).length}
        streakDays={4}
        studentProfile={studentProfile}
        instructorProfile={instructorProfile}
        extraRegisteredStudents={extraRegisteredStudents}
        extraRegisteredInstructors={extraRegisteredInstructors}
        onSelectActiveStudent={handleSelectActiveStudent}
        onSelectActiveInstructor={handleSelectActiveInstructor}
        onOpenStudentProfile={() => {
          if (studentProfile) {
            setIsStudentProfileModalOpen(true);
          } else {
            setIsRegistrationModalOpen(true);
          }
        }}
        onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
        onOpenInstructorRegistrationModal={() => setIsInstructorRegistrationModalOpen(true)}
        onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onLogoutStudent={handleLogoutStudent}
        onLogoutInstructor={handleLogoutInstructor}
        isOwnerSession={isOwnerSession}
        onSelectOwner={handleSelectOwner}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Content Area */}
      <main className="pb-16">
        
        {/* If Course Selected -> Show Course Player View */}
        {selectedCourse ? (
          <CoursePlayer
            course={selectedCourse}
            userProgress={userProgressMap[selectedCourse.id]}
            reviews={reviews}
            currentStudent={studentProfile}
            onBack={() => setSelectedCourse(null)}
            onToggleLessonComplete={handleToggleLessonComplete}
            onOpenQuiz={(course) => setActiveQuizCourse(course)}
            onOpenCertificate={(course) => setCertificateCourse(course)}
            onAddReview={handleAddReview}
            onDeleteReview={handleDeleteReview}
            isAdmin={isOwnerSession}
          />
        ) : (
          <>
            {/* Catalog View */}
            {activeTab === 'catalog' && (
              <>
                <HeroBanner
                  onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                  onExploreCourses={() => {
                    const el = document.getElementById('catalog-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  coursesCount={courses.length}
                  studentsCount={12400}
                />

                <div id="catalog-section">
                  <CourseCatalog
                    courses={courses}
                    userProgressMap={userProgressMap}
                    onSelectCourse={handleSelectCourse}
                    onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                    onOpenAddCourseModal={handleOpenAddCourse}
                    onEditCourse={handleOpenEditCourse}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </div>
              </>
            )}

            {/* Student Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <StudentDashboard
                enrolledCourses={enrolledCourses}
                userProgressMap={userProgressMap}
                onSelectCourse={handleSelectCourse}
                onOpenCertificate={(course) => setCertificateCourse(course)}
                streakDays={4}
                studentProfile={studentProfile}
                onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
                onLogoutStudent={handleLogoutStudent}
              />
            )}

            {/* Instructor Studio Tab */}
            {activeTab === 'instructor' && (
              <InstructorStudio
                instructorCourses={courses}
                onAddCourse={handleAddCourse}
                onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                onOpenAddCourseModal={handleOpenAddCourse}
                onOpenEditCourse={handleOpenEditCourse}
                pendingCourseRequests={pendingCourseRequests}
                instructorProfile={instructorProfile}
                onOpenRegistrationModal={() => setIsInstructorRegistrationModalOpen(true)}
                onLogoutInstructor={handleLogoutInstructor}
              />
            )}
          </>
        )}

      </main>

      {/* Add New User Type Selection Modal (+) */}
      <AddUserTypeModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSelectStudent={() => {
          setIsAddUserModalOpen(false);
          setStudentProfile(null);
          localStorage.removeItem('edu_student_profile');
          handleRoleChange('student');
          setIsRegistrationModalOpen(true);
        }}
        onSelectInstructor={() => {
          setIsAddUserModalOpen(false);
          setInstructorProfile(null);
          localStorage.removeItem('edu_instructor_profile');
          handleRoleChange('instructor');
          setIsInstructorRegistrationModalOpen(true);
        }}
      />

      {/* Student Profile Overview Modal (Shows Student Info & Enrolled Courses) */}
      <StudentProfileModal
        isOpen={isStudentProfileModalOpen}
        onClose={() => setIsStudentProfileModalOpen(false)}
        studentProfile={studentProfile}
        courses={courses}
        userProgressMap={userProgressMap}
        onSelectCourse={handleSelectCourse}
        onOpenCertificate={(course) => setCertificateCourse(course)}
        onEditProfile={() => setIsRegistrationModalOpen(true)}
        onLogout={handleLogoutStudent}
      />

      {/* Student Registration / Profile Modal */}
      <StudentRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setPendingCourseToStart(null);
        }}
        studentProfile={studentProfile}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogoutStudent}
        isInitialRequired={!studentProfile && !!pendingCourseToStart}
      />

      {/* Instructor Registration / Profile Modal */}
      <InstructorRegistrationModal
        isOpen={isInstructorRegistrationModalOpen}
        onClose={() => setIsInstructorRegistrationModalOpen(false)}
        instructorProfile={instructorProfile}
        onSaveProfile={handleSaveInstructorProfile}
        onLogout={handleLogoutInstructor}
      />

      {/* Platform Owner / Secret Admin Modal */}
      <PlatformOwnerAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        allCourses={courses}
        studentProfile={studentProfile}
        instructorProfile={instructorProfile}
        userProgressMap={userProgressMap}
        pendingStudentRequests={pendingStudentRequests}
        extraRegisteredStudents={extraRegisteredStudents}
        pendingInstructorRequests={pendingInstructorRequests}
        extraRegisteredInstructors={extraRegisteredInstructors}
        pendingCourseRequests={pendingCourseRequests}
        onDeleteCourse={handleDeleteCourse}
        onDeleteStudentProfile={handleDeleteStudentProfile}
        onDeleteInstructorProfile={handleDeleteInstructorProfile}
        onApproveStudentRequest={handleApproveStudentRequest}
        onRejectStudentRequest={handleRejectStudentRequest}
        onDeleteStudentByAdmin={handleDeleteStudentByAdmin}
        onApproveInstructorRequest={handleApproveInstructorRequest}
        onRejectInstructorRequest={handleRejectInstructorRequest}
        onDeleteInstructorByAdmin={handleDeleteInstructorByAdmin}
        onApproveCourseRequest={handleApproveCourseRequest}
        onRejectCourseRequest={handleRejectCourseRequest}
      />

      {/* AI Tutor Chat Drawer */}
      <AITutorDrawer
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        studentProfile={studentProfile}
        courses={courses}
        currentCourseTitle={selectedCourse?.title}
        onSelectCourse={(courseId) => {
          const found = courses.find((c) => c.id === courseId);
          if (found) {
            setSelectedCourse(found);
          }
        }}
      />

      {/* AI Course Generator Modal */}
      <AICourseGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onCourseGenerated={(newCourse) => {
          handleAddCourse(newCourse);
          setSelectedCourse(newCourse);
        }}
      />

      {/* Add / Update Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => {
          setIsAddCourseModalOpen(false);
          setCourseToEditId(null);
        }}
        allCourses={courses}
        initialSelectedCourseId={courseToEditId}
        onAddCourse={(newCourse) => {
          handleAddCourse(newCourse);
        }}
        onUpdateCourse={(updatedCourse) => {
          handleUpdateCourse(updatedCourse);
        }}
        onRequestCourseChange={handleRequestCourseChange}
        onDeleteCourse={(courseId) => {
          handleDeleteCourse(courseId);
        }}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        defaultInstructorName={instructorProfile?.fullName}
        instructorEmail={instructorProfile?.email}
        isOwnerSession={isOwnerSession}
      />

      {/* Interactive Quiz Engine Modal */}
      {activeQuizCourse && activeQuizCourse.quiz && (
        <QuizEngine
          course={activeQuizCourse}
          quiz={activeQuizCourse.quiz}
          onFinishQuiz={(scorePercent) => handleFinishQuiz(activeQuizCourse.id, scorePercent)}
          onClose={() => setActiveQuizCourse(null)}
          onViewCertificate={() => {
            const course = activeQuizCourse;
            setActiveQuizCourse(null);
            setCertificateCourse(course);
          }}
        />
      )}

      {/* Printable Certificate Modal */}
      {certificateCourse && (
        <CertificateModal
          course={certificateCourse}
          studentName={studentProfile?.fullName || 'مازن حمادة'}
          gradeScore={userProgressMap[certificateCourse.id]?.quizScores[certificateCourse.id] || 95}
          onClose={() => setCertificateCourse(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400 font-arabic">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 منصة تعلّم - جميع الحقوق محفوظة | منصة التعليم الرقمي بالذكاء الاصطناعي</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <a href="#" className="hover:text-emerald-600 transition-colors">شروط الاستخدام</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">الدعم الفني</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
