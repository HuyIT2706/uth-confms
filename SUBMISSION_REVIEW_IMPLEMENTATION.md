# Submission Review Detail Page - Implementation Summary

## Overview
Successfully built a comprehensive submission detail and review page for reviewers at `/reviewer/submissions/:conferenceId/:submissionId`. This page allows reviewers to view submission details and submit reviews with scores, comments for authors, and internal discussion notes.

## Files Created/Modified

### 1. **SubmissionReviewPage.tsx** (NEW)
**Location:** `d:\uth-confms\client\src\pages\reviewer\SubmissionReviewPage.tsx`

**Features:**
- **Header Section:** Shows submission title and navigation back button
- **Left Panel (2/3 width):** 
  - Displays submission details (title, author, upload date)
  - Shows abstract and keywords
  - Provides download button for submission PDF
- **Right Panel (1/3 width) with 3 Tabs:**
  - **Tab 1 - Đánh giá (Review Form):**
    - Score slider (0-10 with star rating)
    - Content textarea for author feedback (5000 char limit)
    - Internal content textarea for internal notes (2000 char limit, optional)
    - Info box with guidelines
    - Smart button: "Nộp đánh giá" (Submit) or "Cập nhật đánh giá" (Update) if review exists
  
  - **Tab 2 - Lịch sử (Review History):**
    - Shows all previous edits to the review
    - Displays score, content, and internal content for each edit
    - Shows timestamp for each edit
    - Empty state message if no history
  
  - **Tab 3 - Thảo luận (Internal Discussion):**
    - Shows internal notes from other reviewers
    - Only appears if there are discussion items
    - Displays reviewer name, content, and timestamp
    - Read-only view

**Key Features:**
- Loads submission data from the submissions list API
- Pre-fills form if review already exists
- Real-time character counter for both textareas
- Dynamic score slider with visual rating stars
- Loading states and error handling
- Toast notifications for success/error messages
- Responsive layout (mobile-friendly)

### 2. **assignmentsApi.ts** (UPDATED)
**Location:** `d:\uth-confms\client\src\redux\api\assignmentsApi.ts`

**New Types Added:**
```typescript
interface SubmitReviewDto {
    score: number;           // 0-10
    content: string;         // For author (max 5000 chars)
    internalContent?: string; // Internal only (max 2000 chars)
}

interface ReviewData {
    id: string;
    assignmentId: string;
    reviewerId: number;
    score: number;
    content: string;
    internalContent?: string;
    createdAt: string;
    updatedAt: string;
}

interface ReviewHistory {
    id: string;
    score: number;
    content: string;
    internalContent?: string;
    editedAt: string;
    editedBy?: string;
}

interface DiscussionItem {
    id: string;
    reviewerId: number;
    reviewerName: string;
    internalContent: string;
    createdAt: string;
    updatedAt: string;
}
```

**New API Endpoints:**
1. `submitReview(assignmentId, reviewData)` - POST to `/reviewer/assignments/{id}/review`
2. `getMyReview(assignmentId)` - GET from `/reviewer/assignments/{id}/review`
3. `getReviewHistory(assignmentId)` - GET from `/reviewer/assignments/{id}/history`
4. `getInternalDiscussion(assignmentId)` - GET from `/reviewer/assignments/{id}/discussion`

**Exported Hooks:**
- `useSubmitReviewMutation`
- `useGetMyReviewQuery`
- `useGetReviewHistoryQuery`
- `useGetInternalDiscussionQuery`

### 3. **SubmissionListPage.tsx** (UPDATED)
**Location:** `d:\uth-confms\client\src\pages\reviewer\SubmissionListPage.tsx`

**Changes:**
- Updated button navigation from `/reviewer/submissions/{id}` to `/reviewer/submissions/{conferenceId}/{submissionId}`
- Updated both card click handler and button click handler to include `conferenceId` in the route
- Links now properly pass conference context to the review page

### 4. **Routing.tsx** (UPDATED)
**Location:** `d:\uth-confms\client\src\routing\Routing.tsx`

**Changes:**
- Added import for `SubmissionReviewPage`
- Added new route: `/reviewer/submissions/:conferenceId/:submissionId` → `<SubmissionReviewPage />`
- Route positioned before `/reviewer/submissions/:conferenceId` to ensure proper matching

## User Flow

1. **Start from AssignmentListPage** → Click "Xem & Đánh giá" on an accepted assignment
2. **Navigate to SubmissionsOverviewPage** → Select a conference
3. **View SubmissionListPage** → Browse submissions for that conference
4. **Click submission** → Open SubmissionReviewPage to review and submit feedback

**Alternative Flow (Direct):**
- Navigate directly to `/reviewer/submissions/{conferenceId}/{submissionId}`

## API Integration Details

### Review Submission Endpoint
- **Path:** `POST /reviewer/assignments/{assignmentId}/review`
- **Body:**
  ```json
  {
    "score": 7,
    "content": "Detailed feedback for author...",
    "internalContent": "Internal notes for discussion..."
  }
  ```
- **Response:** `ReviewData` object with review details

### Review Retrieval Endpoints
- **Get My Review:** `GET /reviewer/assignments/{assignmentId}/review`
- **Get History:** `GET /reviewer/assignments/{assignmentId}/history`
- **Get Discussion:** `GET /reviewer/assignments/{assignmentId}/discussion`

All endpoints are protected with `@UseGuards(JwtAuthGuard)` on backend.

## UI/UX Highlights

- **Sticky Review Panel:** Right panel stays visible while scrolling left content
- **Smart Button State:** 
  - Shows "Nộp đánh giá" (Submit) if no review exists
  - Shows "Cập nhật đánh giá" (Update) if review already exists
  - Shows loading spinner during submission
- **Character Counters:** Real-time feedback for textarea limits
- **Color Coding:** 
  - Blue info box for guidelines
  - Amber/orange for internal discussion items
  - Icons for visual hierarchy
- **Responsive Design:** Mobile, tablet, and desktop optimized

## Error Handling

- Toast notifications for errors and success
- Detailed error message extraction from API responses
- Proper validation (content required, score 0-10)
- Loading states during API calls
- Fallback messages for empty states

## Type Safety

- Fully TypeScript typed
- Proper generic types for RTK Query hooks
- Type-safe mutation payloads
- Exported types for reuse: `ReviewData`, `SubmitReviewDto`, `ReviewHistory`, `DiscussionItem`

## Testing Checklist

- [ ] Navigate to submission review page
- [ ] Submit a new review with all fields
- [ ] Update existing review
- [ ] View review history tab with edits
- [ ] View internal discussion from other reviewers
- [ ] Score slider adjusts with stars and range input
- [ ] Character counters update in real-time
- [ ] Validation prevents empty content submission
- [ ] Toast notifications appear on success/error
- [ ] Back button navigates correctly
- [ ] Download PDF button works (if file URL available)
- [ ] Mobile responsive layout

## Next Steps (Optional Enhancements)

1. Add review draft auto-save functionality
2. Add ability to restore previous review version from history
3. Add email notification when review is submitted
4. Add review attachment/document upload
5. Add review discussion comment threads
6. Add review templates/guidelines from conference
7. Add plagiarism check integration
8. Add collaborative review features (multiple reviewers)
