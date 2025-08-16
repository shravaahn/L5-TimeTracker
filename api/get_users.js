// This function gets all the users in a given workspace.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    const { teamId } = request.body;

    if (!teamId) {
      return response.status(400).json({ error: 'Team ID is required.' });
    }

    const res = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/user`, {
      headers: {
        'Authorization': token,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch users from ClickUp');
    }

    const data = await res.json();
    response.status(200).json(data.members);

  } catch (error) {
    console.error('SERVER-SIDE GET_USERS ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}