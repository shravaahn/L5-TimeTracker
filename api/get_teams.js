// This is a simple diagnostic tool to get the user's authorized teams.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    // This is the most direct way to ask "Where can this user work?"
    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': token }
    });

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      throw new Error(`Failed to get teams from ClickUp: ${errorText}`);
    }
    
    const data = await teamsResponse.json();
    response.status(200).json(data);

  } catch (error) {
    console.error('SERVER-SIDE GET_TEAMS ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}
