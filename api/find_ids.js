// This tool finds all Spaces and View IDs.
export default async function handler(request, response) {
  try {
    const token = request.headers.authorization;

    const userResponse = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { 'Authorization': token }
    });
    if (!userResponse.ok) throw new Error('Could not get user.');
    const userData = await userResponse.json();
    const teamId = userData.user.teams[0].id;

    const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
      headers: { 'Authorization': token }
    });
    if (!spacesResponse.ok) throw new Error('Could not get spaces.');
    const spacesData = await spacesResponse.json();

    const allViews = [];
    for (const space of spacesData.spaces) {
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