// This is a special diagnostic function to find all Spaces and List IDs.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    // 1. Get User and Team ID
    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Could not get user.');
    const userData = await userResponse.json();
    if (!userData.user.teams || userData.user.teams.length === 0) {
        throw new Error('User is not in any team/workspace.');
    }
    const teamId = userData.user.teams[0].id;

    // 2. Get all Spaces in that Team
    const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
      headers: { 'Authorization': token }
    });
    if (!spacesResponse.ok) throw new Error('Could not get spaces.');
    const spacesData = await spacesResponse.json();
    const spaces = spacesData.spaces;

    // 3. For each Space, get all its Views (including Lists)
    const allLists = [];
    for (const space of spaces) {
      const viewsResponse = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/view`, {
        headers: { 'Authorization': token }
      });
      if (viewsResponse.ok) {
        const viewsData = await viewsResponse.json();
        const listsInSpace = viewsData.views.filter(view => view.type === 'list');
        allLists.push({
          spaceName: space.name,
          spaceId: space.id,
          lists: listsInSpace.map(l => ({ listName: l.name, listId: l.id }))
        });
      }
    }
    
    response.status(200).json({ structure: allLists });

  } catch (error) {
    console.error('SERVER-SIDE FIND_IDS ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}