import { getExploreName } from '../utils/platform';

export const devConfig = {
  sdkKey: 'PpVtOx0w0xQHVbpX1Ia9KztPjPs8XajWgC9q',
  sdkSecret: 'ds8tDu7LlvoQdUmK0ktn7sb95ieigl8JhxBz',
  webEndpoint: 'zoom.us', // zfg use www.zoomgov.com
  topic: 'cv-089322e2-3e9b-4d49-8921-1dcb6c38ebb7',
  name: `Erik Weller`,
  password: '',
  signature: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiUHBWdE94MHcweFFIVmJwWDFJYTlLenRQalBzOFhhaldnQzlxIiwidHBjIjoiY3YtMDg5MzIyZTItM2U5Yi00ZDQ5LTg5MjEtMWRjYjZjMzhlYmI3IiwidG9waWMiOiJDYXJlVmlsbGFnZSBDb25zdWx0YXRpb24gTWVldGluZyIsInJvbGVfdHlwZSI6MCwidmVyc2lvbiI6MSwiaWF0IjoxNzUyNTQ4NzU2LCJleHAiOjE3NTI1NTU5NTYsInVzZXJfaWRlbnRpdHkiOiJFcmlrIn0.mwty3Bogv8IcbM6o3T_HqxFJk_WgRoIqwzFjHEmqkYM',
  sessionKey: '',
  userIdentity: '',
  // The user role. 1 to specify host or co-host. 0 to specify participant, Participants can join before the host. The session is started when the first user joins. Be sure to use a number type.
  role: 1
};
