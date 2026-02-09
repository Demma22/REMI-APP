export const askDeepseek = async (payload) => {
  try {
    const res = await fetch("https://ai-backend-yl4w.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data.answer;

  } catch (error) {
    return "I could not reach Remi's brain.";
  }
};
