#!/usr/bin/env node

const baseUrl = (
  process.env.MVP_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
const timestamp = Date.now();
const email = process.env.MVP_EMAIL || `feynman-smoke+${timestamp}@example.com`;
const password = process.env.MVP_PASSWORD || 'SmokeTest1!';
const name = process.env.MVP_NAME || 'Feynman Smoke';

const demoResourceText =
  process.env.MVP_RESOURCE_TEXT ||
  [
    'Photosynthesis is the process plants use to convert light energy into chemical energy.',
    'Chlorophyll absorbs light, water is split, and carbon dioxide is fixed into glucose.',
    'Oxygen is released as a byproduct, while glucose stores energy for growth and repair.',
  ].join(' ');

const demoTranscript =
  process.env.MVP_TRANSCRIPT ||
  [
    'Photosynthesis happens in chloroplasts.',
    'The plant uses chlorophyll to capture light energy.',
    'It combines carbon dioxide and water to make glucose, and oxygen is released.',
  ].join(' ');

const logStep = message => {
  process.stdout.write(`\n[smoke] ${message}\n`);
};

const fail = message => {
  throw new Error(message);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok || body.success === false) {
    fail(
      `${options.method || 'GET'} ${path} failed with ${response.status}: ${
        body.message || text || response.statusText
      }`
    );
  }

  return body;
};

const authRequest = (token, path, options = {}) =>
  request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

const signupIfNeeded = async () => {
  const signupBody = { name, email, password };

  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupBody),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (response.ok && body.success !== false) {
    return;
  }

  if (!/already exists/i.test(body.message || '')) {
    fail(
      `POST /api/auth/signup failed with ${response.status}: ${body.message || text}`
    );
  }
};

const getAccessToken = async () => {
  const signin = await request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = signin.data?.accessToken;
  if (!token) {
    fail('Signin response did not include data.accessToken');
  }

  return token;
};

const assertArray = (value, label) => {
  if (!Array.isArray(value)) {
    fail(`${label} is not an array`);
  }
};

const getEvaluationPayload = (evaluation, label) => {
  if (evaluation?.structured && typeof evaluation.structured === 'object') {
    return evaluation.structured;
  }

  if (evaluation?.content && typeof evaluation.content === 'object') {
    return evaluation.content;
  }

  if (typeof evaluation?.content === 'string') {
    try {
      return JSON.parse(evaluation.content);
    } catch {
      fail(`${label} content is not valid JSON`);
    }
  }

  fail(`${label} payload is missing`);
};

const main = async () => {
  logStep(`Using API ${baseUrl}`);

  logStep('Creating or reusing smoke user');
  await signupIfNeeded();
  const token = await getAccessToken();

  logStep('Creating TEXT resource');
  const resourceResponse = await authRequest(token, '/api/resources', {
    method: 'POST',
    body: JSON.stringify({
      title: `MVP Smoke Photosynthesis ${timestamp}`,
      sourceType: 'TEXT',
      text: demoResourceText,
      subject: 'biology',
      topic: 'photosynthesis',
    }),
  });

  const resource = resourceResponse.data?.resource;
  const chunkCount = resourceResponse.data?.ingest?.chunkCount;
  if (!resource?.id) {
    fail('Resource response did not include data.resource.id');
  }
  if (resource.status !== 'READY') {
    fail(
      `Resource ${resource.id} status is ${resource.status}, expected READY`
    );
  }
  if (!Number.isInteger(chunkCount) || chunkCount < 1) {
    fail('Resource ingestion did not report at least one chunk');
  }

  logStep('Starting session with resource');
  const sessionResponse = await authRequest(token, '/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      subject: 'biology',
      topic: 'photosynthesis',
      goal: 'Explain photosynthesis clearly',
      resourceIds: [resource.id],
    }),
  });

  const session = sessionResponse.data?.session;
  if (!session?.id) {
    fail('Session response did not include data.session.id');
  }

  logStep('Appending transcript');
  const transcriptResponse = await authRequest(
    token,
    `/api/sessions/${session.id}/transcript`,
    {
      method: 'POST',
      body: JSON.stringify({
        text: demoTranscript,
        startTimeMs: 0,
        endTimeMs: 8000,
      }),
    }
  );
  if (!transcriptResponse.data?.chunk?.id) {
    fail('Transcript response did not include data.chunk.id');
  }

  logStep('Requesting realtime feedback');
  const feedbackResponse = await authRequest(
    token,
    `/api/sessions/${session.id}/feedback`,
    { method: 'POST' }
  );
  const feedback = getEvaluationPayload(
    feedbackResponse.data?.evaluation,
    'Realtime feedback'
  );
  assertArray(feedback?.questions, 'Realtime feedback questions');
  assertArray(feedback?.clarifications, 'Realtime feedback clarifications');
  assertArray(feedback?.detected_gaps, 'Realtime feedback detected_gaps');
  if (typeof feedback?.topic_drift !== 'boolean') {
    fail('Realtime feedback topic_drift is not a boolean');
  }

  logStep('Ending session and generating final evaluation');
  const endResponse = await authRequest(
    token,
    `/api/sessions/${session.id}/end`,
    {
      method: 'POST',
    }
  );
  const finalEvaluation = getEvaluationPayload(
    endResponse.data?.evaluation,
    'Final evaluation'
  );
  if (typeof finalEvaluation?.summary !== 'string') {
    fail('Final evaluation summary is missing');
  }
  assertArray(finalEvaluation.strengths, 'Final evaluation strengths');
  assertArray(finalEvaluation.weaknesses, 'Final evaluation weaknesses');
  assertArray(
    finalEvaluation.missed_concepts,
    'Final evaluation missed_concepts'
  );
  assertArray(finalEvaluation.follow_up, 'Final evaluation follow_up');
  if (typeof finalEvaluation.confidence_score !== 'number') {
    fail('Final evaluation confidence_score is not a number');
  }

  logStep('Fetching final report');
  const reportResponse = await authRequest(
    token,
    `/api/sessions/${session.id}/report`
  );
  if (!reportResponse.data?.evaluation?.id) {
    fail('Report response did not include data.evaluation.id');
  }

  process.stdout.write('\n[smoke] MVP demo flow passed.\n');
  process.stdout.write(
    `[smoke] user=${email} resource=${resource.id} session=${session.id}\n`
  );
};

main().catch(error => {
  process.stderr.write(`\n[smoke] ${error.message}\n`);
  process.exitCode = 1;
});
