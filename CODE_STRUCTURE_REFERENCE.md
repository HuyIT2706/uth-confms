# Code Structure Reference

## File Locations & Sizes

```
d:\uth-confms\
├── client\src\
│   ├── pages\reviewer\
│   │   ├── SubmissionReviewPage.tsx (NEW) - 456 lines
│   │   ├── SubmissionListPage.tsx (MODIFIED) - 2 line changes
│   │   ├── SubmissionsOverviewPage.tsx - unchanged
│   │   ├── AssignmentListPage.tsx - unchanged
│   │   └── ReviewerDashboard.tsx - unchanged
│   ├── redux\api\
│   │   └── assignmentsApi.ts (MODIFIED) - +130 lines
│   └── routing\
│       └── Routing.tsx (MODIFIED) - 3 line changes
├── SUBMISSION_REVIEW_IMPLEMENTATION.md (NEW)
├── REVIEWER_NAVIGATION_FLOW.md (NEW)
└── SUBMISSION_REVIEW_FEATURE_SUMMARY.md (NEW)
```

## SubmissionReviewPage.tsx - Component Structure

```typescript
// IMPORTS
import { useState, useEffect }
import { useParams, useNavigate }
import { Icons } from '@mui/icons-material'
import { CircularProgress, Rating, Tabs, Tab } from '@mui/material'
import { useGetReviewerSubmissionsByConferenceQuery, ... } from redux

// INTERFACES
interface Submission { ... }

// MAIN COMPONENT
const SubmissionReviewPage = () => {
  // PARAMS & NAVIGATION
  const { conferenceId, submissionId } = useParams()
  const navigate = useNavigate()
  
  // API QUERIES & MUTATIONS
  const { data: submissionsData, isLoading } = useGetReviewerSubmissionsByConferenceQuery()
  const [submitReview] = useSubmitReviewMutation()
  const { data: existingReview } = useGetMyReviewQuery()
  const { data: reviewHistory } = useGetReviewHistoryQuery()
  const { data: internalDiscussion } = useGetInternalDiscussionQuery()
  
  // LOCAL STATE
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [review, setReview] = useState({
    score: 5,
    content: '',
    internalContent: '',
  })
  
  // EFFECTS
  useEffect(() => { /* Find submission in list */ }, [submissionsData, submissionId])
  useEffect(() => { /* Load existing review */ }, [existingReview])
  
  // VALIDATION & ERROR HANDLING
  if (!conferenceId || !submissionId) { /* Error view */ }
  if (submissionsLoading) { /* Loading view */ }
  if (!submission) { /* Not found view */ }
  
  // EVENT HANDLERS
  const formatDate = (dateString: string) => { /* Format date */ }
  const handleSubmitReview = async () => { /* Submit review to API */ }
  
  // RENDER - Main Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#008689] to-[#006666]">
        {/* Back button & title */}
      </div>
      
      {/* CONTENT */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL (2/3) - Submission Info */}
          <div className="lg:col-span-2">
            {/* Paper Info Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Title */}
              {/* Author & Date */}
              {/* Abstract */}
              {/* Keywords */}
              {/* Download Button */}
            </div>
          </div>
          
          {/* RIGHT PANEL (1/3) - Review Form with Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-24">
              
              {/* TABS NAVIGATION */}
              <Tabs value={tabValue} onChange={...}>
                <Tab label="Đánh giá" icon={<Edit />} />
                <Tab label="Lịch sử" icon={<History />} />
                {internalDiscussion?.length > 0 && (
                  <Tab label="Thảo luận" icon={<Comment />} />
                )}
              </Tabs>
              
              {/* TAB 1: REVIEW FORM */}
              {tabValue === 0 && (
                <div className="p-8">
                  {/* Score Input */}
                  {/* Content for Author */}
                  {/* Internal Content */}
                  {/* Info Box */}
                  {/* Submit Button */}
                </div>
              )}
              
              {/* TAB 2: REVIEW HISTORY */}
              {tabValue === 1 && (
                <div className="p-8">
                  {/* History entries with timestamps */}
                </div>
              )}
              
              {/* TAB 3: INTERNAL DISCUSSION */}
              {tabValue === 2 && internalDiscussion?.length > 0 && (
                <div className="p-8">
                  {/* Discussion items from other reviewers */}
                </div>
              )}
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default SubmissionReviewPage
```

## assignmentsApi.ts - New Additions

```typescript
// NEW INTERFACES
interface SubmitReviewDto {
  score: number;
  content: string;
  internalContent?: string;
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

// NEW ENDPOINTS IN assignmentsApi
endpoints: (builder) => ({
  // ... existing endpoints ...
  
  // Submit/Update review
  submitReview: builder.mutation<ReviewData, { assignmentId: string; reviewData: SubmitReviewDto }>({
    query: ({ assignmentId, reviewData }) => ({
      url: `/reviewer/assignments/${assignmentId}/review`,
      method: 'POST',
      body: reviewData,
    }),
    invalidatesTags: (_result, _error, { assignmentId }) => [
      { type: 'ReviewerAssignment', id: assignmentId },
      { type: 'ReviewerAssignment', id: 'MY_LIST' },
    ],
  }),

  // Get reviewer's own review
  getMyReview: builder.query<ReviewData, string>({
    query: (assignmentId) => `/reviewer/assignments/${assignmentId}/review`,
    providesTags: (_result, _error, assignmentId) => [
      { type: 'ReviewerAssignment', id: `REVIEW_${assignmentId}` },
    ],
  }),

  // Get review edit history
  getReviewHistory: builder.query<ReviewHistory[], string>({
    query: (assignmentId) => `/reviewer/assignments/${assignmentId}/history`,
    providesTags: (_result, _error, assignmentId) => [
      { type: 'ReviewerAssignment', id: `HISTORY_${assignmentId}` },
    ],
  }),

  // Get internal discussion notes
  getInternalDiscussion: builder.query<DiscussionItem[], string>({
    query: (assignmentId) => `/reviewer/assignments/${assignmentId}/discussion`,
    providesTags: (_result, _error, assignmentId) => [
      { type: 'ReviewerAssignment', id: `DISCUSSION_${assignmentId}` },
    ],
  }),
})

// NEW EXPORTS
export const {
  // ... existing exports ...
  useSubmitReviewMutation,
  useGetMyReviewQuery,
  useGetReviewHistoryQuery,
  useGetInternalDiscussionQuery,
} = assignmentsApi
```

## Routing.tsx - Changes

```typescript
// ADDED IMPORT
import SubmissionReviewPage from '../pages/reviewer/SubmissionReviewPage.tsx'

// IN CHILDREN ARRAY, ADDED NEW ROUTE (positioned before :conferenceId route)
{
  path: 'reviewer/submissions/:conferenceId/:submissionId',
  element: <SubmissionReviewPage />,
},
```

## SubmissionListPage.tsx - Changes

```typescript
// CHANGE 1: Card click handler
onClick={() => navigate(`/reviewer/submissions/${conferenceId}/${submission.id}`)}

// CHANGE 2: Button click handler  
onClick={(e) => {
  e.stopPropagation();
  navigate(`/reviewer/submissions/${conferenceId}/${submission.id}`);
}}
```

## Feature Interaction Flow

```
SubmissionListPage
    ↓
    └─ User clicks "Xem & Đánh giá" button
       ↓
       └─ Navigate to `/reviewer/submissions/${conferenceId}/${submissionId}`
          ↓
          └─ SubmissionReviewPage Loads
             ├─ Fetch submission from submissionsData
             ├─ Load existing review if available
             ├─ Load review history
             └─ Load internal discussion
                ↓
                ├─ User fills score (Tab 1)
                ├─ User writes content (Tab 1)
                ├─ User adds internal notes (Tab 1)
                └─ User clicks "Nộp đánh giá" or "Cập nhật đánh giá"
                   ↓
                   └─ Call submitReview mutation
                      ├─ POST to `/reviewer/assignments/{id}/review`
                      ├─ Toast notification on success
                      └─ Navigate back to SubmissionListPage
```

## Data Fetching Pattern

```typescript
// Pattern used in SubmissionReviewPage

// Fetch list data
const { data: submissionsData } = useGetReviewerSubmissionsByConferenceQuery(conferenceId)

// Fetch detail data (dependent on submissionId)
const { data: existingReview } = useGetMyReviewQuery(submissionId, { 
  skip: !submissionId // Don't fetch until we have submissionId
})

// Find specific item in list data
useEffect(() => {
  if (Array.isArray(submissionsData) && submissionId) {
    const found = submissionsData.find(s => s.id === submissionId)
    if (found) setSubmission(found)
  }
}, [submissionsData, submissionId])

// Pre-fill form with existing data
useEffect(() => {
  if (existingReview) {
    setReview({
      score: existingReview.score,
      content: existingReview.content,
      internalContent: existingReview.internalContent || '',
    })
  }
}, [existingReview])
```

## Form Submission Pattern

```typescript
// Pattern used for submitReview

const handleSubmitReview = async () => {
  // 1. Validate
  if (!review.content.trim()) {
    showToast.error('Vui lòng nhập nhận xét')
    return
  }

  // 2. Set loading state
  setIsSubmitting(true)
  
  try {
    // 3. Call mutation
    await submitReview({
      assignmentId: submissionId,
      reviewData: {
        score: review.score,
        content: review.content,
        internalContent: review.internalContent || undefined,
      },
    }).unwrap()

    // 4. Show success
    showToast.success('Đánh giá đã được nộp thành công')
    
    // 5. Navigate after delay
    setTimeout(() => {
      navigate(-1)
    }, 1500)
    
  } catch (error: any) {
    // 6. Handle error
    const errorMessage = error?.data?.message || 'Có lỗi xảy ra'
    showToast.error(errorMessage)
    console.error('Error submitting review:', error)
    
  } finally {
    // 7. Clear loading state
    setIsSubmitting(false)
  }
}
```

## Component Props & Types Summary

```typescript
// useGetReviewerSubmissionsByConferenceQuery
Query: (conferenceId: string) => ReviewerSubmission[]

// useSubmitReviewMutation  
Mutation: ({
  assignmentId: string
  reviewData: SubmitReviewDto
}) => ReviewData

// useGetMyReviewQuery
Query: (assignmentId: string, options?: { skip?: boolean }) => ReviewData | undefined

// useGetReviewHistoryQuery
Query: (assignmentId: string, options?: { skip?: boolean }) => ReviewHistory[]

// useGetInternalDiscussionQuery
Query: (assignmentId: string, options?: { skip?: boolean }) => DiscussionItem[]
```

## Key Implementation Details

### State Management
- Uses React hooks (useState) for local UI state
- Uses RTK Query for server state management
- Automatic cache invalidation on mutation success

### Error Handling
- Try-catch blocks for API calls
- Toast notifications for user feedback
- Console logging for debugging
- Graceful fallbacks for missing data

### Performance Optimization
- Conditional queries with `skip` option
- Lazy loading of tabs (only render active tab)
- Sticky positioning for right panel
- Efficient re-renders with dependency arrays

### Accessibility
- Semantic HTML elements
- Form labels and descriptions
- Keyboard navigation support
- Icon + text labels for tabs

### Responsive Design
- Mobile-first approach
- Grid layout with responsive columns
- Flexible spacing with Tailwind utilities
- Readable text sizes at all breakpoints

