// This is the final, robust version of the ID finder.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    // 1. Get the authorized teams using the reliable endpoint.
    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { 'Authorization': token }
    });
    if (!teamsResponse.ok) throw new Error('Could not get authorized teams.');
    const teamsData = await teamsResponse.json();

    // 2. Safety check: Ensure the teams list exists and is not empty.
    if (!teamsData.teams || teamsData.teams.length === 0) {
      throw new Error('Your user is not authorized for any workspace according to the API.');
    }
    const teamId = teamsData.teams[0].id; // Get the ID from the first team.

    // 3. Get all Spaces in that Team
    const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
      headers: { 'Authorization': token }
    });
    if (!spacesResponse.ok) throw new Error('Could not get spaces.');
    const spacesData = await spacesResponse.json();
    const spaces = spacesData.spaces;

    // 4. For each Space, get ALL its Views
    const allViews = [];
    for (const space of spaces) {
      const viewsResponse = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/view`, {
        headers: { 'Authorization': token }
      });
      if (viewsResponse.ok) {
        const viewsData = await viewsResponse.json();
        allViews.push({
          spaceName: space.name,
          spaceId: space.id,
          views: viewsData.views.map(v => ({ viewName: v.name, viewId: v.id, viewType: v.type }))
        });
      }
    }
    
    response.status(200).json({ structure: allViews });

  } catch (error) {
    console.error('SERVER-SIDE FIND_IDS ERROR:', error);
    response.status(500).json({ error: error.message });
  }
}