// This is our new secure helper for fetching data from ClickUp.
// It runs on the server and is not blocked by browser security (CORS).

export default async function handler(request, response) {
  try {
    // Get the access token that the front-end sent in the header
    const token = request.headers.authorization;

    // 1. Get User Info from ClickUp
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user from ClickUp');
    const userData = await userResponse.json();
    const user = userData.user;
    const team = user.teams[0]; // User's primary team/workspace

    // 2. Get Assigned Tasks from ClickUp
    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/task?assignees[]=${user.id}`, {
      headers: { 'Authorization': token }
    });
    if (!tasksResponse.ok) throw new Error('Failed to fetch tasks from ClickUp');
    const tasksData = await tasksResponse.json();

    // 3. Send the user info and tasks back to our front-end
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