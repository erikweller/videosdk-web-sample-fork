/* eslint-disable no-restricted-globals */
import React from 'react';
import { createRoot } from 'react-dom/client';
import ZoomVideo from '@zoom/videosdk';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ZoomContext from './context/zoom-context';
import { devConfig } from './config/dev';
import { b64DecodeUnicode, generateVideoToken } from './utils/util';

// Merge query params first — this preserves URL-provided role and signature
let meetingArgs: any = {
  ...devConfig,
  ...Object.fromEntries(new URLSearchParams(location.search))
};

// Properly decode select base64 fields
if (meetingArgs.web && meetingArgs.web !== '0') {
  ['topic', 'name', 'password', 'sessionKey', 'userIdentity'].forEach((field) => {
    if (Object.hasOwn(meetingArgs, field)) {
      try {
        meetingArgs[field] = b64DecodeUnicode(meetingArgs[field]);
      } catch (e) {
        console.log('ignore base64 decode', field, meetingArgs[field]);
      }
    }
  });
}

// Parse `role` safely — default to 0 (participant) if not present
meetingArgs.role = parseInt(meetingArgs.role ?? '0', 10);

// Force video player mode to use <video> elements
meetingArgs.useVideoPlayer = 1;

// Normalize numeric flags
['enforceGalleryView', 'enforceVB', 'cloud_recording_option', 'cloud_recording_election'].forEach((field) => {
  if (Object.hasOwn(meetingArgs, field)) {
    try {
      meetingArgs[field] = Number(meetingArgs[field]);
    } catch (e) {
      meetingArgs[field] = 0;
    }
  }
});

if (meetingArgs?.telemetry_tracking_id) {
  try {
    meetingArgs.telemetry_tracking_id = b64DecodeUnicode(meetingArgs.telemetry_tracking_id);
  } catch (e) {}
} else {
  meetingArgs.telemetry_tracking_id = '';
}

// Fallback: generate signature locally if not provided
if (!meetingArgs.signature && meetingArgs.sdkSecret && meetingArgs.topic) {
  meetingArgs.signature = generateVideoToken(
    meetingArgs.sdkKey,
    meetingArgs.sdkSecret,
    meetingArgs.topic,
    meetingArgs.sessionKey,
    meetingArgs.userIdentity,
    meetingArgs.role,
    meetingArgs.cloud_recording_option,
    meetingArgs.cloud_recording_election,
    meetingArgs.telemetry_tracking_id
  );

  console.log('=====================================');
  console.log('🔐 Signature was generated on the fly. Full meetingArgs:', meetingArgs);

  const urlArgs: any = {
    topic: meetingArgs.topic,
    name: meetingArgs.name,
    password: meetingArgs.password,
    sessionKey: meetingArgs.sessionKey,
    userIdentity: meetingArgs.userIdentity,
    role: meetingArgs.role,
    cloud_recording_option: meetingArgs.cloud_recording_option || '',
    cloud_recording_election: meetingArgs.cloud_recording_election || '',
    telemetry_tracking_id: meetingArgs.telemetry_tracking_id || '',
    enforceGalleryView: 0,
    enforceVB: 0,
    web: '1'
  };

  console.log('🧪 Suggested test URL:');
  console.log(window.location.origin + '/?' + new URLSearchParams(urlArgs).toString());
}

// Ensure webEndpoint is always set
if (!meetingArgs.webEndpoint) {
  meetingArgs.webEndpoint = 'zoom.us';
}

const zmClient = ZoomVideo.createClient();
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ZoomContext.Provider value={zmClient}>
      <App meetingArgs={meetingArgs as any} />
    </ZoomContext.Provider>
  </React.StrictMode>
);

// Optional performance reporting
reportWebVitals();
