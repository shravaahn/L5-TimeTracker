// FINAL VERSION
// This function securely fetches the user's data from ClickUp.

export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    // 1. Get User Info
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user from ClickUp');
    const userData = await userResponse.json();
    const user = userData.user;

    // --- FINAL SAFETY CHECK ---
    if (!user.teams || user.teams.length === 0) {
      return response.status(400).json({ error: 'Your ClickUp account does not belong to any workspace. Please check your People settings in ClickUp.' });
    }

    const team = user.teams[0];

    // 2. Get Assigned Tasks
    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?assignees[]=${user.id}`, {
      headers: { 'Authorization': token }
    });
    if (!tasksResponse.ok) throw new Error('Failed to fetch tasks from ClickUp');
    const tasksData = await tasksResponse.json();

    // 3. Send the final data back to the front-end
    response.status(200).json({
      username: user.username,
      teamName: team.name,
      tasks: tasksData.tasks
    });

  } catch (error) {
    console.error('SERVER-SIDE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}