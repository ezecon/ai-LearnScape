import { supabase }
from "@/lib/supabase";

const BASE_URL =
  process.env
    .NEXT_PUBLIC_BACKEND_URL;

async function getToken() {

  const {
    data
  } =
  await supabase.auth
    .getSession();

  return data
    .session
    ?.access_token;
}

export async function getProfile() {

  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/auth/me`,
      {
        headers: {
          Authorization:
          `Bearer ${token}`
        }
      }
    );

  return res.json();
}

export async function submitAnswer(
  topic,
  isCorrect
) {

  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/performance/submit`,
      {
        method: "POST",

        headers: {

          "Content-Type":
          "application/json",

          Authorization:
          `Bearer ${token}`
        },

        body:
        JSON.stringify({

          topic,
          is_correct:
          isCorrect
        })
      }
    );

  return res.json();
}

export async function getRecommendation(
  userId,
  classLevel,
  language = 'en'
) {

  const token =
    await getToken();

  const res =
    await fetch(

      `${BASE_URL}/performance/recommendation/${userId}/${classLevel}?language=${language}`,

      {
        headers: {
          Authorization:
          `Bearer ${token}`
        }
      }
    );

  return res.json();
}

export async function generateQuestion(
  userId,
  topic,
  environment = "General",
  classLevel = 6,
  language = 'en'
) {

  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/ai/generate`,
      {
        method: "POST",

        headers: {

          "Content-Type":
          "application/json",

          Authorization:
          `Bearer ${token}`
        },

        body:
        JSON.stringify({

          user_id:
          userId,

          topic,

          environment,

          class_level:
          classLevel,
          language,
        })
      }
    );

  return res.json();
}
export async function getWeakTopics(
  userId
) {
  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/performance/weak-topics/${userId}`,
      {
        headers: {
          Authorization:
          `Bearer ${token}`
        }
      }
    );

  return res.json();
}

export async function getAnalytics(
  userId
) {
  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/performance/analytics/${userId}`,
      {
        headers: {
          Authorization:
          `Bearer ${token}`
        }
      }
    );

  return res.json();
}

export async function getMastery(
  userId
) {
  const token =
    await getToken();

  const res =
    await fetch(
      `${BASE_URL}/performance/mastery/${userId}`,
      {
        headers: {
          Authorization:
          `Bearer ${token}`
        }
      }
    );

  return res.json();
}

export async function getRemediation(
  userId,
  classLevel,
  language = 'en'
) {
  const token = await getToken();

  const res = await fetch(
    `${BASE_URL}/performance/remediation/${userId}/${classLevel}?language=${language}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.json();
}
export async function getLeaderboard() {
  const token = await getToken()

  const res = await fetch(
    `${BASE_URL}/performance/leaderboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return res.json()
}

// Question history save করো (generate হওয়ার পরে call করো)
export async function saveQuestionHistory(data) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/history/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

// Answer submit হওয়ার পরে result update করো
export async function updateQuestionHistory(historyId, studentAnswer, isCorrect) {
  const token = await getToken()
  const res = await fetch(
    `${BASE_URL}/history/update/${historyId}?student_answer=${encodeURIComponent(studentAnswer)}&is_correct=${isCorrect}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  return res.json()
}

// History list পাও
export async function getQuestionHistory(userId, limit = 20) {
  const token = await getToken()
  const res = await fetch(
    `${BASE_URL}/history/${userId}?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  return res.json()
}