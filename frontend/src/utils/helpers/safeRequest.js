export async function safeRequest(
  promise,
  fallbackMessage = "An unexpected error occurred."
) {
  try {
    const response = await promise;
    if (!response || !response.data) {
      throw new Error("Empty response");
    }
    return response;
  } catch (error) {
    if (!error.handled) {
      if (error.response) {
        const msg = error.response?.data?.msg || fallbackMessage;
        console.error("Error message:", msg);
      }
    }
    throw error;
  }
}
