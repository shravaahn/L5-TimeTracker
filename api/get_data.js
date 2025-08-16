// DEBUGGING VERSION
// This function will fetch the user profile and send the raw data
// directly to the front-end so we can see its structure.

export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user from ClickUp for debugging');
    }
    
    // Get the raw data and send it straight back to the browser
    const rawUserData = await userResponse.json();
    response.status(200).json(rawUserData);

  } catch (error) {
    console.error('SERVER-SIDE DEBUG ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}