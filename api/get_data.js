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


//////////////////////////



// FINAL PRODUCTION VERSION V2
// This version uses the reliable /team endpoint to get the workspace ID.

/*export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    const VIEW_ID = process.env.CLICKUP_VIEW_ID;
    
    if (!VIEW_ID) {
      throw new Error('ClickUp View ID is not configured in Vercel environment variables.');
    }

    // 1. Get User's authorized teams using the RELIABLE endpoint
    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': token }
    });
    if (!teamsResponse.ok) throw new Error('Could not get authorized teams.');
    const teamsData = await teamsResponse.json();
    
    // Safety Check: This is where the error was happening. This check is now against the reliable data.
    if (!teamsData.teams || teamsData.teams.length === 0) {
        return response.status(400).json({ error: 'Your ClickUp account does not belong to any workspace. Please check your People settings in ClickUp.' });
    }
    const team = teamsData.teams[0];
    const teamId = team.id;

    // 2. Get the basic user info (for ID and username)
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user from ClickUp');
    const userData = await userResponse.json();
    const user = userData.user;
    
    // 3. Find the user's role from the reliable team data
    const memberDetails = team.members.find(m => m.user.id === user.id);
    const userRole = memberDetails ? memberDetails.user.role : 3; // Default to 'member'

    // 4. Fetch all tasks from our specific View
    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/view/${VIEW_ID}/task`, {
      headers: { 'Authorization': token }
    });
    if (!tasksResponse.ok) throw new Error('Failed to fetch tasks from the specified view.');
    const tasksData = await tasksResponse.json();

    // 5. Filter the tasks to only show those assigned to the logged-in user
    const assignedTasks = tasksData.tasks.filter(task => 
        task.assignees.some(assignee => assignee.id === user.id)
    );

    // 6. Send the final data back to the front-end
    response.status(200).json({
      userId: user.id,
      username: user.username,
      teamId: teamId,
      teamName: team.name,
      role: userRole,
      tasks: assignedTasks
    });

  } catch (error) {
    console.error('SERVER-SIDE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}*/

// This version provides the correct data for admins vs. members.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;
    const VIEW_ID = process.env.CLICKUP_VIEW_ID;
    
    if (!VIEW_ID) {
      throw new Error('ClickUp View ID is not configured in Vercel environment variables.');
    }

    // 1. Get User's authorized teams using the reliable endpoint
    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': token }
    });
    if (!teamsResponse.ok) throw new Error('Could not get authorized teams.');
    const teamsData = await teamsResponse.json();
    
    if (!teamsData.teams || teamsData.teams.length === 0) {
        return response.status(400).json({ error: 'Your ClickUp account does not belong to any workspace.' });
    }
    const team = teamsData.teams[0];
    const teamId = team.id;

    // 2. Get the basic user info
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user from ClickUp');
    const userData = await userResponse.json();
    const user = userData.user;
    
    // 3. Find the user's role from the reliable team data
    const memberDetails = team.members.find(m => m.user.id === user.id);
    const userRole = memberDetails ? memberDetails.user.role : 3; // Default to 'member'

    // 4. Fetch ALL tasks from our specific View
    const tasksResponse = await fetch(`https://api.clickup.com/api/v2/view/${VIEW_ID}/task`, {
      headers: { 'Authorization': token }
    });
    if (!tasksResponse.ok) throw new Error('Failed to fetch tasks from the specified view.');
    const tasksData = await tasksResponse.json();
    const allTasks = tasksData.tasks;

    // 5. **Conditional Filtering Logic**
    let tasksToSend;
    // ClickUp roles: 1=owner, 2=admin, 3=member, 4=guest
    if (userRole <= 2) {
        // If user is an Admin or Owner, send ALL tasks from the view
        tasksToSend = allTasks;
    } else {
        // If user is a Member, filter to only show their assigned tasks
        tasksToSend = allTasks.filter(task => 
            task.assignees.some(assignee => assignee.id === user.id)
        );
    }

    // 6. Send the final data back to the front-end
    response.status(200).json({
      userId: user.id,
      username: user.username,
      teamId: teamId,
      teamName: team.name,
      role: userRole,
      tasks: tasksToSend // Send the correctly filtered list
    });

  } catch (error) {
    console.error('SERVER-SIDE ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}