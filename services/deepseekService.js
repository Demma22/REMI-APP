export const askDeepseek = async (payload) => {
  try {
    const res = await fetch("http://192.168.1.64/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data.answer;

  } catch (error) {
    console.log("DeepSeek error:", error);
    return "I could not reach Remi's brain.";
  }
};
