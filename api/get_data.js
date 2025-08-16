/*// FINAL PRODUCTION VERSION
// This function fetches tasks from the specific View ID.

export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    const VIEW_ID = process.env.CLICKUP_VIEW_ID;

    if (!VIEW_ID) {
      throw new Error('ClickUp View ID is not configured in Vercel environment variables.');
    }

    // 1. Get User Info (for filtering and role check)
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user from ClickUp');
    const userData = await userResponse.json();
    const user = userData.user;

    // This endpoint reliably gives us the team info
    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': token }
    });
    if (!teamsResponse.ok) throw new Error('Could not get authorized teams.');
    const teamsData = await teamsResponse.json();
    if (!teamsData.teams || teamsData.teams.length === 0) {
        throw new Error('User is not authorized for any workspace.');
    }
    const team = teamsData.teams[0];

    // Find the user's role in their primary team
    const member_details = team.members.find(m => m.user.id === user.id);
    const userRole = member_details ? member_details.user.role : 3; // Default to 'member' if not found

    // 2. Fetch all tasks from our specific View
    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/view/${VIEW_ID}/task`, {
      headers: { 'Authorization': token }
    });
    if (!tasksResponse.ok) throw new Error('Failed to fetch tasks from the specified view.');
    const tasksData = await tasksResponse.json();

    // 3. Filter the tasks to only show those assigned to the logged-in user
    const assignedTasks = tasksData.tasks.filter(task => 
        task.assignees.some(assignee => assignee.id === user.id)
    );

    // 4. Send the final data back to the front-end
    response.status(200).json({
      userId: user.id,
      username: user.username,
      teamId: team.id,
      teamName: team.name,
      role: userRole,
      tasks: assignedTasks
    });

  } catch (error) {
    console.error('SERVER-SIDE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}

*/

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

    // --- SAFETY CHECK ---
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
      userId: user.id,
      username: user.username,
      teamId: team.id,
      teamName: team.name,
      role: team.role, // <-- ADDED USER ROLE
      tasks: tasksData.tasks
    });

  } catch (error) {
    console.error('SERVER-SIDE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}