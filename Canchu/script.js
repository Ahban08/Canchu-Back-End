// k6 run script.js

import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 40,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
};
// test HTTP
export default function () {
  const headers = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ1c2VyMTNAdGVzdC5jb20iLCJuYW1lIjoidXNlcjEzIiwicGljdHVyZSI6bnVsbCwiaWF0IjoxNjkyNDE5MDQ4LCJleHAiOjE2OTI0NDc4NDh9.zEt-bOnBIorNe7BjD38TBvGd4Ms9NcTeawSDoBIAcXo'
  }
  const res = http.get('http://54.197.149.235/api/1.0/posts/search', { headers: headers});
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}