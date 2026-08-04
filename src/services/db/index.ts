/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSupabaseAvailable, testSupabaseConnection } from './helpers';
import { initializeLocalStorage } from './seedData';
import { authService } from './authService';
import { modelService } from './modelService';
import { bookingService } from './bookingService';
import { paymentService } from './paymentService';
import { messageService } from './messageService';
import { reviewService } from './reviewService';
import { postService } from './postService';
import { payoutService } from './payoutService';
import { auditService } from './auditService';
import { blogService } from './blogService';
import { jobRequirementService } from './jobRequirementService';
import * as userService from './userService';

export const dbService = {
  // Authentication & Session
  auth: {
    onAuthStateChanged: authService.onAuthStateChanged
  },
  getCurrentSessionUser: authService.getCurrentSessionUser.bind(authService),
  setCurrentSessionUser: authService.setCurrentSessionUser.bind(authService),
  sendPasswordReset: authService.sendPasswordReset.bind(authService),
  getUserByEmail: authService.getUserByEmail.bind(authService),
  signInWithEmailAndPassword: authService.signInWithEmailAndPassword.bind(authService),
  signUpWithEmailAndPassword: authService.signUpWithEmailAndPassword.bind(authService),
  signInWithGoogle: authService.signInWithGoogle.bind(authService),
  logOut: authService.logOut.bind(authService),
  registerCredentials: authService.registerCredentials.bind(authService),
  getCredentials: authService.getCredentials.bind(authService),

  // Models
  subscribeToModels: modelService.subscribeToModels.bind(modelService),
  getModels: modelService.getModels.bind(modelService),
  saveModel: modelService.saveModel.bind(modelService),
  registerModel: modelService.registerModel.bind(modelService),
  deleteModel: modelService.deleteModel.bind(modelService),

  // Bookings
  subscribeToBookings: bookingService.subscribeToBookings.bind(bookingService),
  getBookings: bookingService.getBookings.bind(bookingService),
  addBooking: bookingService.addBooking.bind(bookingService),
  updateBookingStatus: bookingService.updateBookingStatus.bind(bookingService),
  updateBookingPdfSummary: bookingService.updateBookingPdfSummary.bind(bookingService),

  // Payments & Unlocks
  getPayments: paymentService.getPayments.bind(paymentService),
  addPayment: paymentService.addPayment.bind(paymentService),
  getUnlockedProfiles: paymentService.getUnlockedProfiles.bind(paymentService),
  unlockProfile: paymentService.unlockProfile.bind(paymentService),
  verifyPaymentRecordBySessionId: paymentService.verifyPaymentRecordBySessionId.bind(paymentService),
  verifySessionAndUnlockProfile: paymentService.verifySessionAndUnlockProfile.bind(paymentService),

  // Users
  getUsers: userService.getUsers,
  saveUser: userService.saveUser,
  getUser: userService.getUser,
  deleteUser: userService.deleteUser,
  getUserFavorites: userService.getUserFavorites,
  saveUserFavorites: userService.saveUserFavorites,

  // Messages
  getMessages: messageService.getMessages.bind(messageService),
  addMessage: messageService.addMessage.bind(messageService),
  clearAllMessages: messageService.clearAllMessages.bind(messageService),

  // Reviews
  getReviews: reviewService.getReviews.bind(reviewService),
  addReview: reviewService.addReview.bind(reviewService),

  // Posts / Social
  getPosts: postService.getPosts.bind(postService),
  savePost: postService.savePost.bind(postService),
  toggleLikePost: postService.toggleLikePost.bind(postService),

  // Job Requirements & Casting Board
  getJobRequirements: jobRequirementService.getJobRequirements.bind(jobRequirementService),
  createJobRequirement: jobRequirementService.createJobRequirement.bind(jobRequirementService),
  applyForJobRequirement: jobRequirementService.applyForJobRequirement.bind(jobRequirementService),

  // Blogs
  getBlogs: blogService.getBlogs.bind(blogService),
  saveBlog: blogService.saveBlog.bind(blogService),
  deleteBlog: blogService.deleteBlog.bind(blogService),
  updateBlogStatus: blogService.updateStatus.bind(blogService),
  getBlogCategories: blogService.getCategories.bind(blogService),

  // Audit Logs
  subscribeToAuditLogs: auditService.subscribeToAuditLogs.bind(auditService),
  getAuditLogs: auditService.getAuditLogs.bind(auditService),
  addAuditLog: auditService.addAuditLog.bind(auditService),

  // Payouts
  subscribeToPayouts: payoutService.subscribeToPayouts.bind(payoutService),
  getPayouts: payoutService.getPayouts.bind(payoutService),
  savePayout: payoutService.savePayout.bind(payoutService),
  updatePayoutStatus: payoutService.updatePayoutStatus.bind(payoutService),

  // Helpers / Connection testing
  testSupabaseConnection,
  isSupabaseAvailable,
  initializeLocalStorage
};

export default dbService;
export { isSupabaseAvailable };
