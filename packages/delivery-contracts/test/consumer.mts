import {validateSubmission,validateDelivery,inputAction,readiness,type Submission,type Delivery} from '@zixcel/view-delivery-contracts'

const submission:Submission=validateSubmission({})
const delivery:Delivery=validateDelivery({})
if(delivery.snapshot)inputAction(delivery.snapshot,submission)
readiness([],[])
// @ts-expect-error command identities are strings
const invalid:Submission={...submission,actionId:3}
void invalid
