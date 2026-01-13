import { createMachine, createActor, assign } from 'xstate';


enum AI_Review_Status {
  AI_REVIEW_PENDING = 'AI_REVIEW_PENDING',
  AI_REVIEW_APPROVED = 'AI_REVIEW_APPROVED',
  AI_REVIEW_ON_HOLD = 'AI_REVIEW_ON_HOLD',
  AI_REVIEW_REJECTED = 'AI_REVIEW_REJECTED',
}

enum CV_Screen_Status {
  CV_PENDING = 'CV_PENDING',
  CV_APPROVED = 'CV_APPROVED',
  CV_FAILED = 'CV_FAILED'
}

enum Interview_Status {
  INTERVIEW_PENDING = 'INTERVIEW_PENDING',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_SELECTED = 'INTERVIEW_SELECTED',
  INTERVIEW_ON_HOLD = 'INTERVIEW_ON_HOLD',
  INTERVIEW_REJECTED = 'INTERVIEW_REJECTED'
}

enum Hiring_Status {
  HIRING_PENDING = 'HIRING_PENDING',
  HIRING_SELECTED = 'HIRING_SELECTED',
  HIRING_REJECTED = 'HIRING_REJECTED',
  HIRING_ONHOLD = 'HIRING_ONHOLD'
}

type InitialStatus = {
  aiReviewStatus: AI_Review_Status,
  cvScreenStatus: CV_Screen_Status | null,
  interviewStatus: Interview_Status | null,
  hiringStatus: Hiring_Status | null,
  cvScreeningStatusUpdatedBy: Number | null,
  interviewStatusUpdatedBy: Number | null,
  hiringStatusUpdatedBy: Number | null
}

enum availableStates {
  aiReview = "aiReview",
  cvScreen = 'cvScreen',
  interview = 'interview',
  hiring = 'hiring'
}

const initialStatus: InitialStatus = {
  aiReviewStatus: AI_Review_Status.AI_REVIEW_PENDING,
  cvScreenStatus: null,
  interviewStatus: null,
  hiringStatus: null,
  cvScreeningStatusUpdatedBy: null,
  interviewStatusUpdatedBy: null,
  hiringStatusUpdatedBy: null
}

// State machine
// const toggleMachine = createMachine({
//   id: 'toggle',
//   initial: 'init',
//   context: {
//     aiReviewStatus: AI_Review_Status.AI_REVIEW_PENDING,
//     cvScreenStatus: null,
//     interviewStatus: null,
//     hiringStatus: null
//   },
//   states: {
//     init: {
//       on: {
//         start: {
//           target: (ctx) => getNextStep(ctx),
//           actions: 'updateContext',
//         }
//       }
//     }
//   }
//   on: {
//     next: {
//       actions: assign({})
//     },
//     prev: {
//       actions: assign({})
//     }
//   }
// });

const getInitialState = (context: InitialStatus) => {
  const { cvScreenStatus, interviewStatus, hiringStatus } = context
  if (!cvScreenStatus && !interviewStatus && !hiringStatus) {
    return availableStates.aiReview
  }

  if (cvScreenStatus && !interviewStatus && !hiringStatus) {
    return availableStates.cvScreen
  }

  if (cvScreenStatus && interviewStatus && !hiringStatus) {
    return availableStates.interview
  }

  if (cvScreenStatus && interviewStatus && hiringStatus) {
    return availableStates.hiring
  }

  return availableStates.aiReview
}
const toggleMachine = createMachine({
  id: 'cvState',
  initial: getInitialState(initialStatus), // database call
  context: initialStatus,
  states: {
    [availableStates.aiReview]: {
      on: {
        [AI_Review_Status.AI_REVIEW_APPROVED]: {
          target: availableStates.cvScreen,
          actions: assign({
            aiReviewStatus: (context) => {
              console.log(context)
              return AI_Review_Status.AI_REVIEW_APPROVED
            },
            cvScreenStatus: CV_Screen_Status.CV_PENDING
          })
        },
        [AI_Review_Status.AI_REVIEW_REJECTED]: {
          target: 'end',
          actions: assign({ aiReviewStatus: AI_Review_Status.AI_REVIEW_REJECTED })
        },
        [AI_Review_Status.AI_REVIEW_ON_HOLD]: {
          target: availableStates.aiReview,
          actions: assign({ aiReviewStatus: AI_Review_Status.AI_REVIEW_ON_HOLD })
        }
      }
    },
    [availableStates.cvScreen]: {
      on: {
        [CV_Screen_Status.CV_APPROVED]: {
          target: availableStates.interview,
          actions: assign({
            cvScreenStatus: CV_Screen_Status.CV_APPROVED,
            interviewStatus: Interview_Status.INTERVIEW_PENDING
          })
        },
        [CV_Screen_Status.CV_FAILED]: {
          target: 'end',
          actions: assign({ cvScreenStatus: CV_Screen_Status.CV_FAILED })
        },
        [CV_Screen_Status.CV_PENDING]: {
          target: availableStates.cvScreen,
          actions: assign({ cvScreenStatus: CV_Screen_Status.CV_PENDING })
        }
      }
    },
    [availableStates.interview]: {
      on: {
        [Interview_Status.INTERVIEW_SELECTED]: {
          target: availableStates.hiring,
          actions: assign({
            interviewStatus: Interview_Status.INTERVIEW_SELECTED,
            hiringStatus: Hiring_Status.HIRING_PENDING,
            interviewStatusUpdatedBy: 0
          })
        },
        [Interview_Status.INTERVIEW_REJECTED]: {
          target: 'end',
          actions: assign({ 
            interviewStatus: Interview_Status.INTERVIEW_REJECTED,
            interviewStatusUpdatedBy: 0 
          })
        },
        [Interview_Status.INTERVIEW_ON_HOLD]: {
          target: availableStates.interview,
          actions: assign({ 
            interviewStatus: Interview_Status.INTERVIEW_ON_HOLD,
            interviewStatusUpdatedBy: 0
           })
        }
      }
    },
    [availableStates.hiring]: {
      on: {
        [Hiring_Status.HIRING_SELECTED]: {
          target: 'end',
          actions: assign({ 
            hiringStatus: Hiring_Status.HIRING_SELECTED,
            hiringStatusUpdatedBy: 0
           })
        },
        [Hiring_Status.HIRING_REJECTED]: {
          target: 'end',
          actions: assign({ 
            hiringStatus: Hiring_Status.HIRING_REJECTED,
            hiringStatusUpdatedBy: 0 
          })
        },
        [Hiring_Status.HIRING_PENDING]: {
          target: availableStates.hiring,
          actions: assign({ 
            hiringStatus: Hiring_Status.HIRING_ONHOLD,
            hiringStatusUpdatedBy: 0 
          })
        }
      }
    },
    end: {
      type: 'final'
    }
  }
});


// Actor (instance of the machine logic, like a store)
const actor = createActor(toggleMachine);
actor.subscribe({
  next(state) {
    console.table(state.value)
    console.table(state.context)
  },
  error(err) {
    console.log(err)
  }
});
actor.start();
// actor.send({ type: AI_Review_Status.AI_REVIEW_APPROVED });
actor.send({ type: AI_Review_Status.AI_REVIEW_APPROVED, payload: {userId: 1} });
actor.send({type: CV_Screen_Status.CV_APPROVED});
actor.send({type: Interview_Status.INTERVIEW_ON_HOLD})
actor.send({type: Interview_Status.INTERVIEW_SCHEDULED})
actor.send({type: Interview_Status.INTERVIEW_SELECTED})
actor.send({type: Hiring_Status.HIRING_ONHOLD})
actor.send({type: Hiring_Status.HIRING_REJECTED})