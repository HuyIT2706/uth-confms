# Reviewer Feature Navigation Flow

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REVIEWER DASHBOARD                                  │
│  /reviewer/dashboard                                                        │
│                                                                              │
│  [Nhận được lời mời]  →  /reviewer/invitations                             │
│       (VIEW)                                                                 │
│                                                                              │
│  [Xem bài được giao]  →  /reviewer/submissions                             │
│       (ROUTE1)                                                               │
│                                                                              │
│  [Xem danh sách lời mời phân công] → /reviewer/assignments                │
│       (ROUTE2)                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ ROUTE 1          │  │ ROUTE 2          │  │ Invitations      │
        │ /reviewer/       │  │ /reviewer/       │  │ /reviewer/       │
        │ submissions      │  │ assignments      │  │ invitations      │
        │                  │  │                  │  │                  │
        │ Overview Page    │  │ Assignment List  │  │ Invitation List  │
        │ - Show all conf. │  │ - Show inv. with │  │ - Show all conf. │
        │ - Click to list  │  │   submissions    │  │ - Accept/Reject  │
        │                  │  │ - Accept/Reject  │  │ - View topics    │
        └────────┬─────────┘  │   status change  │  │ - Add interests  │
                 │            └────────┬─────────┘  └──────────────────┘
                 │                     │
                 └─────────┬───────────┘
                           │
        ┌──────────────────────────────────────────────────┐
        │ /reviewer/submissions/:conferenceId              │
        │ SUBMISSION LIST PAGE                             │
        │                                                  │
        │ - Grid layout (3 columns) submissions            │
        │ - Search by title/author                        │
        │ - Shows: title, abstract, keywords, author       │
        │ - Button: "Xem & Đánh giá" for each submission  │
        │ - Only shows submissions from accepted conf.    │
        └────────────────┬─────────────────────────────────┘
                         │
                         │ Click "Xem & Đánh giá"
                         │
                         ▼
        ┌──────────────────────────────────────────────────┐
        │ /reviewer/submissions/:conferenceId/:submissionId│
        │ SUBMISSION REVIEW DETAIL PAGE                    │
        │                                                  │
        │ ┌────────────────────────────────────────────┐  │
        │ │ LEFT PANEL (2/3)                           │  │
        │ │ - Submission Info (title, author, date)    │  │
        │ │ - Abstract                                 │  │
        │ │ - Keywords                                 │  │
        │ │ - Download PDF Button                      │  │
        │ └────────────────────────────────────────────┘  │
        │ ┌────────────────────────────────────────────┐  │
        │ │ RIGHT PANEL (1/3) - TABBED                 │  │
        │ │                                            │  │
        │ │ Tab 1: Đánh giá (Review Form)             │  │
        │ │ - Score Slider (0-10)                      │  │
        │ │ - Content for Author (textarea)            │  │
        │ │ - Internal Content (textarea, optional)    │  │
        │ │ - Submit/Update Button                     │  │
        │ │                                            │  │
        │ │ Tab 2: Lịch sử (Review History)           │  │
        │ │ - Shows all previous edits                 │  │
        │ │ - Score, content, timestamp for each       │  │
        │ │                                            │  │
        │ │ Tab 3: Thảo luận (Internal Discussion)    │  │
        │ │ - Read-only view of other reviewers' notes│  │
        │ │ - Only shows if discussion exists         │  │
        │ └────────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Page 1: ReviewerDashboard
**Entry Point:** `/reviewer/dashboard`
- User clicks "Xem bài được giao" → Route to `/reviewer/submissions`
- User clicks "Xem lời mời phân công" → Route to `/reviewer/assignments`

### Page 2: SubmissionsOverviewPage
**Route:** `/reviewer/submissions`
- **Data Source:** `useGetMyReviewerAssignmentsQuery()` + `useGetReviewerInvitationsQuery()`
- **Purpose:** Show all conferences where user accepted assignments
- **Action:** Click conference card → Route to `/reviewer/submissions/:conferenceId`

### Page 3: SubmissionListPage
**Route:** `/reviewer/submissions/:conferenceId`
- **Data Source:** `useGetReviewerSubmissionsByConferenceQuery(conferenceId)`
- **Purpose:** Show all submissions for a specific conference
- **Action:** Click submission card or "Xem & Đánh giá" button → Route to `/reviewer/submissions/:conferenceId/:submissionId`

### Page 4: SubmissionReviewPage (NEW)
**Route:** `/reviewer/submissions/:conferenceId/:submissionId`
- **Data Sources:**
  - `useGetReviewerSubmissionsByConferenceQuery(conferenceId)` - Get submission details
  - `useSubmitReviewMutation` - Submit/update review
  - `useGetMyReviewQuery(submissionId)` - Load existing review
  - `useGetReviewHistoryQuery(submissionId)` - Show edit history
  - `useGetInternalDiscussionQuery(submissionId)` - Show reviewer discussions
- **Purpose:** Allow reviewer to write and submit review
- **Actions:**
  - Fill score (0-10)
  - Enter content for author
  - Enter internal notes (optional)
  - Submit/Update review
  - View review history
  - View other reviewers' internal notes

## API Endpoints Used

### Existing Endpoints (Used by previous pages)
```
GET  /api/reviewer/assignments
GET  /api/reviewer/invitations
GET  /api/reviewer/assignments/{conferenceId}/submissions
POST /api/reviewer/assignments/{id}/accept
POST /api/reviewer/assignments/{id}/reject
POST /api/reviewer/assignments/{id}/pending
```

### New Endpoints (Used by SubmissionReviewPage)
```
POST /api/reviewer/assignments/{assignmentId}/review
GET  /api/reviewer/assignments/{assignmentId}/review
GET  /api/reviewer/assignments/{assignmentId}/history
GET  /api/reviewer/assignments/{assignmentId}/discussion
```

## Component Hierarchy

```
ProtectedRoute
└── LayoutApp
    ├── ReviewerDashboard (/reviewer/dashboard)
    ├── InvitationListPage (/reviewer/invitations)
    ├── InvitationTopicsPage (/reviewer/invitations/:id/topics)
    ├── AssignmentListPage (/reviewer/assignments)
    ├── SubmissionsOverviewPage (/reviewer/submissions)
    ├── SubmissionListPage (/reviewer/submissions/:conferenceId)
    └── SubmissionReviewPage (/reviewer/submissions/:conferenceId/:submissionId) [NEW]
```

## Feature Status

### Completed Features ✅
- [x] Assignment list with locked/unlocked submissions
- [x] Submissions overview by conference
- [x] Submission list with search and filtering
- [x] Submission detail page with review form
- [x] Review form with score, content, internal notes
- [x] Review history tab showing edit history
- [x] Internal discussion tab for reviewer notes
- [x] Smart submit/update button based on review state
- [x] Toast notifications for success/error
- [x] Character limit feedback
- [x] Responsive mobile-friendly design
- [x] Type-safe Redux API integration

### Ready for Testing ✅
- Full navigation flow from dashboard to review submission
- All API endpoints connected and typed
- All UI components rendered and styled
- Error handling for network requests
- Loading states for async operations

## Usage Instructions

### For Reviewers:
1. Go to Reviewer Dashboard
2. Click "Xem bài được giao"
3. Select a conference
4. Click on a submission
5. Enter review score (use slider or star rating)
6. Write feedback for author (required)
7. Add internal notes for discussion (optional)
8. Click "Nộp đánh giá" to submit
9. Use tabs to view history or other reviewers' notes
10. Can update review by editing and clicking "Cập nhật đánh giá"

### For Developers:
- API hooks are in `assignmentsApi.ts` with full TypeScript support
- Page component in `SubmissionReviewPage.tsx` with responsive design
- Routing configured in `Routing.tsx`
- Uses Material-UI components for consistent design
- Toast notifications via `showToast` utility

## Known Limitations (For Future Enhancement)

1. Review draft auto-save not implemented
2. No plagiarism check integration
3. No review version restore from history
4. No email notifications
5. No collaborative review features
6. No review templates/guidelines
7. No file attachment for reviews
8. No discussion comment threads

