// This is a simple test to see if we can fetch tasks with the custom view ID.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    
    // The View ID you provided. We are testing this directly.
    const VIEW_ID = 'k6hww-66631';

    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/view/${VIEW_ID}/task`, {
      headers: { 'Authorization': token }
    });

    const data = await tasksResponse.json();

    if (!tasksResponse.ok) {
      // If it fails, send the error message from ClickUp back to the front-end.
      throw new Error(JSON.stringify(data));
    }
    
    // If it succeeds, send the tasks back.
    response.status(200).json(data);

  } catch (error) {
    console.error('SERVER-SIDE TEST_VIEW ERROR:', error);
    // Ensure the error response is also JSON
    response.status(500).json({ error: error.message });
  }
}